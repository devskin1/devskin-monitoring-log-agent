import * as winston from 'winston';
import * as glob from 'glob';
import * as path from 'path';
import { AgentConfig, ParsedLog, LogSource } from './types';
import { ApiClient } from './api-client';
import { FileTailer } from './tailers/file.tailer';

export class LogAgent {
  private config: AgentConfig;
  private apiClient: ApiClient;
  private logger: winston.Logger;
  private tailers: Map<string, FileTailer> = new Map();
  private logBuffer: ParsedLog[] = [];
  private flushTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private isRunning = false;

  constructor(config: AgentConfig) {
    this.config = {
      batchSize: 100,
      flushInterval: 5000,
      debug: false,
      ...config,
    };

    this.apiClient = new ApiClient(
      this.config.serverUrl,
      this.config.apiKey,
      this.config.applicationName,
      this.config.debug
    );

    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    return winston.createLogger({
      level: this.config.debug ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level.toUpperCase()}] ${message}`;
        })
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'devskin-log-agent.log',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),
      ],
    });
  }

  async start(): Promise<void> {
    try {
      this.logger.info('Starting DevSkin Log Agent...');

      // Discover and start tailing log files
      await this.discoverLogFiles();

      // Start flush and heartbeat timers
      this.isRunning = true;
      this.startFlushTimer();
      this.startHeartbeatTimer();

      this.logger.info('Log Agent started successfully');
    } catch (error: any) {
      this.logger.error(`Failed to start agent: ${error.message}`);
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping Log Agent...');
    this.isRunning = false;

    // Stop all tailers
    for (const [name, tailer] of this.tailers.entries()) {
      tailer.stop();
    }
    this.tailers.clear();

    // Clear timers
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Flush remaining logs
    await this.flush();

    this.logger.info('Log Agent stopped');
  }

  private async discoverLogFiles(): Promise<void> {
    this.logger.info('Discovering log files...');

    for (const source of this.config.sources) {
      // Check if path contains glob pattern
      if (source.path.includes('*')) {
        // Find all matching files
        const files = glob.sync(source.path, { absolute: true });

        if (files.length === 0) {
          this.logger.warn(`No files found matching pattern: ${source.path}`);
          continue;
        }

        // Create a tailer for each file
        for (const file of files) {
          const fileSource: LogSource = {
            ...source,
            name: `${source.name}:${path.basename(file)}`,
            path: file,
          };

          this.startTailer(fileSource);
        }
      } else {
        // Single file
        this.startTailer(source);
      }
    }

    this.logger.info(`Started tailing ${this.tailers.size} log files`);
  }

  private startTailer(source: LogSource): void {
    const tailer = new FileTailer(
      source,
      (log) => this.handleLog(log),
      (error) => this.handleError(source.name, error)
    );

    try {
      tailer.start();
      this.tailers.set(source.name, tailer);
    } catch (error: any) {
      this.logger.error(`Failed to start tailer for ${source.name}: ${error.message}`);
    }
  }

  private handleLog(log: ParsedLog): void {
    // Add to buffer
    this.logBuffer.push(log);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.config.batchSize!) {
      this.flush();
    }
  }

  private handleError(sourceName: string, error: Error): void {
    this.logger.error(`Error from ${sourceName}: ${error.message}`);
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private startHeartbeatTimer(): void {
    this.heartbeatTimer = setInterval(async () => {
      try {
        await this.apiClient.sendHeartbeat();
        this.logger.debug('Heartbeat sent');
      } catch (error: any) {
        this.logger.error(`Failed to send heartbeat: ${error.message}`);
      }
    }, 30000);
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.apiClient.sendLogs(logsToSend);
      this.logger.debug(`Flushed ${logsToSend.length} logs`);
    } catch (error: any) {
      this.logger.error(`Failed to flush logs: ${error.message}`);
      // Put logs back in buffer
      this.logBuffer.unshift(...logsToSend);
    }
  }
}
