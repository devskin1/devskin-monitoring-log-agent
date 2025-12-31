import { LogParser, LogSource } from '../types';
import { JsonParser } from './json.parser';
import { RegexParser } from './regex.parser';
/**
 * Parser factory
 */
export declare class ParserFactory {
    static createParser(source: LogSource): LogParser;
}
export { JsonParser, RegexParser };
//# sourceMappingURL=index.d.ts.map