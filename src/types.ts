/**
 * Type definitions for Log Agent
 */

export interface AgentConfig {
  /** DevSkin backend URL */
  serverUrl: string;

  /** API key for authentication */
  apiKey: string;

  /** Application name */
  applicationName: string;

  /** Environment (production, staging, etc) */
  environment?: string;

  /** Log sources to tail */
  sources: LogSource[];

  /** Batch size for sending logs */
  batchSize?: number;

  /** Flush interval in milliseconds */
  flushInterval?: number;

  /** Enable debug logging */
  debug?: boolean;
}

export interface LogSource {
  /** Unique name for this source */
  name: string;

  /** File path or glob pattern */
  path: string;

  /** Log format (json, nginx, apache, custom) */
  format?: string;

  /** Custom parser regex (for format: custom) */
  parser?: string;

  /** Additional labels to attach to logs */
  labels?: Record<string, string>;

  /** Start from beginning of file (default: false, tail only new lines) */
  fromBeginning?: boolean;
}

export interface ParsedLog {
  timestamp: Date;
  level: string;
  message: string;
  source: string;
  application: string;
  environment?: string;
  labels?: Record<string, string>;
  attributes?: Record<string, any>;
  raw_log?: string;
}

export interface LogParser {
  parse(line: string, source: LogSource): ParsedLog | null;
}
