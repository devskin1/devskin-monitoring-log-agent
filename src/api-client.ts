import axios, { AxiosInstance } from 'axios';
import { ParsedLog } from './types';

/**
 * API client for sending logs to DevSkin backend
 */
export class ApiClient {
  private client: AxiosInstance;
  private apiKey: string;
  private applicationName: string;
  private debug: boolean;

  constructor(serverUrl: string, apiKey: string, applicationName: string, debug = false) {
    this.apiKey = apiKey;
    this.applicationName = applicationName;
    this.debug = debug;

    this.client = axios.create({
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
  async sendLogs(logs: ParsedLog[]): Promise<void> {
    if (logs.length === 0) return;

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
    } catch (error: any) {
      console.error('[Log Agent] Failed to send logs:', error.message);
    }
  }

  /**
   * Send heartbeat
   */
  async sendHeartbeat(): Promise<void> {
    try {
      await this.client.post('/api/v1/logs/heartbeat', {
        application: this.applicationName,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      if (this.debug) {
        console.error('[Log Agent] Failed to send heartbeat:', error.message);
      }
    }
  }
}
