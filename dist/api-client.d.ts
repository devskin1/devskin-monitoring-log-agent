import { ParsedLog } from './types';
/**
 * API client for sending logs to DevSkin backend
 */
export declare class ApiClient {
    private client;
    private apiKey;
    private applicationName;
    private debug;
    constructor(serverUrl: string, apiKey: string, applicationName: string, debug?: boolean);
    /**
     * Send logs in batch
     */
    sendLogs(logs: ParsedLog[]): Promise<void>;
    /**
     * Send heartbeat
     */
    sendHeartbeat(): Promise<void>;
}
//# sourceMappingURL=api-client.d.ts.map