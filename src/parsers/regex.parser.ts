import { LogParser, ParsedLog, LogSource } from '../types';

/**
 * Generic regex-based parser
 */
export class RegexParser implements LogParser {
  private static readonly COMMON_PATTERNS: Record<string, RegExp> = {
    // Common log format: [2024-01-15 10:30:45] INFO: This is a log message
    common: /^\[(.+?)\]\s+(\w+):\s+(.+)$/,

    // Nginx access log
    nginx:
      /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) \S+" (\d+) (\d+) "([^"]*)" "([^"]*)"/,

    // Apache access log
    apache: /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) \S+" (\d+) (\d+)/,

    // Syslog format
    syslog: /^(\w+\s+\d+\s+\d+:\d+:\d+) (\S+) (\w+)\[(\d+)\]: (.+)$/,
  };

  parse(line: string, source: LogSource): ParsedLog | null {
    let regex: RegExp;

    // Get regex pattern
    if (source.parser) {
      try {
        regex = new RegExp(source.parser);
      } catch (error) {
        console.error(`Invalid regex pattern for source ${source.name}:`, error);
        return this.parseAsPlainText(line, source);
      }
    } else if (source.format && RegexParser.COMMON_PATTERNS[source.format]) {
      regex = RegexParser.COMMON_PATTERNS[source.format];
    } else {
      // Default to common pattern
      regex = RegexParser.COMMON_PATTERNS.common;
    }

    const match = line.match(regex);

    if (!match) {
      return this.parseAsPlainText(line, source);
    }

    // Extract based on format
    if (source.format === 'nginx' || source.format === 'apache') {
      return this.parseWebServerLog(match, source, line);
    } else if (source.format === 'syslog') {
      return this.parseSyslog(match, source, line);
    } else {
      return this.parseCommonFormat(match, source, line);
    }
  }

  private parseCommonFormat(match: RegExpMatchArray, source: LogSource, raw: string): ParsedLog {
    return {
      timestamp: new Date(match[1] || Date.now()),
      level: match[2]?.toUpperCase() || 'INFO',
      message: match[3] || raw,
      source: source.name,
      application: '',
      labels: source.labels,
      raw_log: raw,
    };
  }

  private parseWebServerLog(
    match: RegExpMatchArray,
    source: LogSource,
    raw: string
  ): ParsedLog {
    const statusCode = parseInt(match[5] || '200');
    const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';

    return {
      timestamp: new Date(match[2] || Date.now()),
      level,
      message: `${match[3]} ${match[4]} - ${statusCode}`,
      source: source.name,
      application: '',
      labels: source.labels,
      attributes: {
        client_ip: match[1],
        method: match[3],
        path: match[4],
        status_code: statusCode,
        bytes_sent: parseInt(match[6] || '0'),
        referer: match[7],
        user_agent: match[8],
      },
      raw_log: raw,
    };
  }

  private parseSyslog(match: RegExpMatchArray, source: LogSource, raw: string): ParsedLog {
    return {
      timestamp: new Date(match[1] || Date.now()),
      level: 'INFO',
      message: match[5] || raw,
      source: source.name,
      application: '',
      labels: source.labels,
      attributes: {
        hostname: match[2],
        process: match[3],
        pid: parseInt(match[4] || '0'),
      },
      raw_log: raw,
    };
  }

  private parseAsPlainText(line: string, source: LogSource): ParsedLog {
    return {
      timestamp: new Date(),
      level: 'INFO',
      message: line,
      source: source.name,
      application: '',
      labels: source.labels,
      raw_log: line,
    };
  }
}
