"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * API client for sending logs to DevSkin backend
 */
class ApiClient {
    constructor(serverUrl, apiKey, applicationName, debug = false) {
        this.apiKey = apiKey;
        this.applicationName = applicationName;
        this.debug = debug;
        this.client = axios_1.default.create({
            baseURL: serverUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'X-DevSkin-API-Key': apiKey,
            },
        });
    }
    /**
     * Send logs in batch
     */
    async sendLogs(logs) {
        if (logs.length === 0)
            return;
        try {
            if (this.debug) {
                console.log(`[Log Agent] Sending ${logs.length} logs`);
            }
            // Add application name to all logs
            const logsWithApp = logs.map((log) => ({
                ...log,
                application: this.applicationName,
                timestamp: log.timestamp.toISOString(),
            }));
            await this.client.post('/api/v1/logs/batch', {
                application: this.applicationName,
                logs: logsWithApp,
            });
        }
        catch (error) {
            console.error('[Log Agent] Failed to send logs:', error.message);
        }
    }
    /**
     * Send heartbeat
     */
    async sendHeartbeat() {
        try {
            await this.client.post('/api/v1/logs/heartbeat', {
                application: this.applicationName,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            if (this.debug) {
                console.error('[Log Agent] Failed to send heartbeat:', error.message);
            }
        }
    }
}
exports.ApiClient = ApiClient;
//# sourceMappingURL=api-client.js.map