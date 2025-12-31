import { LogParser, ParsedLog, LogSource } from '../types';

/**
 * Parser for JSON formatted logs
 */
export class JsonParser implements LogParser {
  parse(line: string, source: LogSource): ParsedLog | null {
    try {
      const json = JSON.parse(line);

      // Try to extract common fields
      const timestamp = this.extractTimestamp(json);
      const level = this.extractLevel(json);
      const message = this.extractMessage(json);

      if (!message) {
        return null;
      }

      return {
        timestamp,
        level,
        message,
        source: source.name,
        application: '',
        labels: source.labels,
        attributes: json,
        raw_log: line,
      };
    } catch (error) {
      // Not valid JSON, return null
      return null;
    }
  }

  private extractTimestamp(json: any): Date {
    // Common timestamp field names
    const timestampFields = [
      'timestamp',
      'time',
      '@timestamp',
      'datetime',
      'created_at',
      'createdAt',
      'date',
    ];

    for (const field of timestampFields) {
      if (json[field]) {
        const date = new Date(json[field]);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    return new Date();
  }

  private extractLevel(json: any): string {
    // Common level field names
    const levelFields = ['level', 'severity', 'loglevel', 'log_level', 'priority'];

    for (const field of levelFields) {
      if (json[field]) {
        return String(json[field]).toUpperCase();
      }
    }

    return 'INFO';
  }

  private extractMessage(json: any): string {
    // Common message field names
    const messageFields = ['message', 'msg', 'text', 'log', 'content'];

    for (const field of messageFields) {
      if (json[field]) {
        return String(json[field]);
      }
    }

    // If no message field, stringify the entire object
    return JSON.stringify(json);
  }
}
