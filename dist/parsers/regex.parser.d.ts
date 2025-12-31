import { LogParser, ParsedLog, LogSource } from '../types';
/**
 * Generic regex-based parser
 */
export declare class RegexParser implements LogParser {
    private static readonly COMMON_PATTERNS;
    parse(line: string, source: LogSource): ParsedLog | null;
    private parseCommonFormat;
    private parseWebServerLog;
    private parseSyslog;
    private parseAsPlainText;
}
//# sourceMappingURL=regex.parser.d.ts.map