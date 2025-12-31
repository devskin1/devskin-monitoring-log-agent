"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogAgent = void 0;
const winston = __importStar(require("winston"));
const glob = __importStar(require("glob"));
const path = __importStar(require("path"));
const api_client_1 = require("./api-client");
const file_tailer_1 = require("./tailers/file.tailer");
class LogAgent {
    constructor(config) {
        this.tailers = new Map();
        this.logBuffer = [];
        this.isRunning = false;
        this.config = {
            batchSize: 100,
            flushInterval: 5000,
            debug: false,
            ...config,
        };
        this.apiClient = new api_client_1.ApiClient(this.config.serverUrl, this.config.apiKey, this.config.applicationName, this.config.debug);
        this.logger = this.createLogger();
    }
    createLogger() {
        return winston.createLogger({
            level: this.config.debug ? 'debug' : 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.printf(({ timestamp, level, message }) => {
                return `${timestamp} [${level.toUpperCase()}] ${message}`;
            })),
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
    async start() {
        try {
            this.logger.info('Starting DevSkin Log Agent...');
            // Discover and start tailing log files
            await this.discoverLogFiles();
            // Start flush and heartbeat timers
            this.isRunning = true;
            this.startFlushTimer();
            this.startHeartbeatTimer();
            this.logger.info('Log Agent started successfully');
        }
        catch (error) {
            this.logger.error(`Failed to start agent: ${error.message}`);
            throw error;
        }
    }
    async stop() {
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
    async discoverLogFiles() {
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
                    const fileSource = {
                        ...source,
                        name: `${source.name}:${path.basename(file)}`,
                        path: file,
                    };
                    this.startTailer(fileSource);
                }
            }
            else {
                // Single file
                this.startTailer(source);
            }
        }
        this.logger.info(`Started tailing ${this.tailers.size} log files`);
    }
    startTailer(source) {
        const tailer = new file_tailer_1.FileTailer(source, (log) => this.handleLog(log), (error) => this.handleError(source.name, error));
        try {
            tailer.start();
            this.tailers.set(source.name, tailer);
        }
        catch (error) {
            this.logger.error(`Failed to start tailer for ${source.name}: ${error.message}`);
        }
    }
    handleLog(log) {
        // Add to buffer
        this.logBuffer.push(log);
        // Flush if buffer is full
        if (this.logBuffer.length >= this.config.batchSize) {
            this.flush();
        }
    }
    handleError(sourceName, error) {
        this.logger.error(`Error from ${sourceName}: ${error.message}`);
    }
    startFlushTimer() {
        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.config.flushInterval);
    }
    startHeartbeatTimer() {
        this.heartbeatTimer = setInterval(async () => {
            try {
                await this.apiClient.sendHeartbeat();
                this.logger.debug('Heartbeat sent');
            }
            catch (error) {
                this.logger.error(`Failed to send heartbeat: ${error.message}`);
            }
        }, 30000);
    }
    async flush() {
        if (this.logBuffer.length === 0)
            return;
        const logsToSend = [...this.logBuffer];
        this.logBuffer = [];
        try {
            await this.apiClient.sendLogs(logsToSend);
            this.logger.debug(`Flushed ${logsToSend.length} logs`);
        }
        catch (error) {
            this.logger.error(`Failed to flush logs: ${error.message}`);
            // Put logs back in buffer
            this.logBuffer.unshift(...logsToSend);
        }
    }
}
exports.LogAgent = LogAgent;
//# sourceMappingURL=agent.js.map