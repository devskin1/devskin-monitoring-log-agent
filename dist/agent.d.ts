import { AgentConfig } from './types';
export declare class LogAgent {
    private config;
    private apiClient;
    private logger;
    private tailers;
    private logBuffer;
    private flushTimer?;
    private heartbeatTimer?;
    private isRunning;
    constructor(config: AgentConfig);
    private createLogger;
    start(): Promise<void>;
    stop(): Promise<void>;
    private discoverLogFiles;
    private startTailer;
    private handleLog;
    private handleError;
    private startFlushTimer;
    private startHeartbeatTimer;
    private flush;
}
//# sourceMappingURL=agent.d.ts.map