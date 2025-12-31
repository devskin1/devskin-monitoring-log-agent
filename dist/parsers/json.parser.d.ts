import { LogParser, ParsedLog, LogSource } from '../types';
/**
 * Parser for JSON formatted logs
 */
export declare class JsonParser implements LogParser {
    parse(line: string, source: LogSource): ParsedLog | null;
    private extractTimestamp;
    private extractLevel;
    private extractMessage;
}
//# sourceMappingURL=json.parser.d.ts.map