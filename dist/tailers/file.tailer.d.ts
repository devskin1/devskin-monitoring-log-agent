import { LogSource, ParsedLog } from '../types';
/**
 * File tailer for following log files
 */
export declare class FileTailer {
    private tail;
    private source;
    private parser;
    private onLogCallback;
    private onErrorCallback;
    constructor(source: LogSource, onLog: (log: ParsedLog) => void, onError: (error: Error) => void);
    /**
     * Start tailing the file
     */
    start(): void;
    /**
     * Stop tailing the file
     */
    stop(): void;
    /**
     * Handle a new log line
     */
    private handleLine;
    /**
     * Get source name
     */
    getSourceName(): string;
}
//# sourceMappingURL=file.tailer.d.ts.map