import { Tail } from 'tail';
import { LogSource, ParsedLog } from '../types';
import { ParserFactory } from '../parsers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * File tailer for following log files
 */
export class FileTailer {
  private tail: Tail | null = null;
  private source: LogSource;
  private parser: any;
  private onLogCallback: (log: ParsedLog) => void;
  private onErrorCallback: (error: Error) => void;

  constructor(
    source: LogSource,
    onLog: (log: ParsedLog) => void,
    onError: (error: Error) => void
  ) {
    this.source = source;
    this.parser = ParserFactory.createParser(source);
    this.onLogCallback = onLog;
    this.onErrorCallback = onError;
  }

  /**
   * Start tailing the file
   */
  start(): void {
    // Check if file exists
    if (!fs.existsSync(this.source.path)) {
      this.onErrorCallback(new Error(`File not found: ${this.source.path}`));
      return;
    }

    try {
      this.tail = new Tail(this.source.path, {
        fromBeginning: this.source.fromBeginning || false,
        follow: true,
        useWatchFile: false,
      });

      this.tail.on('line', (line: string) => {
        this.handleLine(line);
      });

      this.tail.on('error', (error: Error) => {
        this.onErrorCallback(error);
      });

      console.log(`[FileTailer] Started tailing: ${this.source.path}`);
    } catch (error: any) {
      this.onErrorCallback(error);
    }
  }

  /**
   * Stop tailing the file
   */
  stop(): void {
    if (this.tail) {
      this.tail.unwatch();
      this.tail = null;
      console.log(`[FileTailer] Stopped tailing: ${this.source.path}`);
    }
  }

  /**
   * Handle a new log line
   */
  private handleLine(line: string): void {
    // Skip empty lines
    if (!line || line.trim().length === 0) {
      return;
    }

    try {
      const parsedLog = this.parser.parse(line, this.source);

      if (parsedLog) {
        this.onLogCallback(parsedLog);
      }
    } catch (error: any) {
      this.onErrorCallback(new Error(`Failed to parse line: ${error.message}`));
    }
  }

  /**
   * Get source name
   */
  getSourceName(): string {
    return this.source.name;
  }
}
