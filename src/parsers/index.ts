import { LogParser, LogSource } from '../types';
import { JsonParser } from './json.parser';
import { RegexParser } from './regex.parser';

/**
 * Parser factory
 */
export class ParserFactory {
  static createParser(source: LogSource): LogParser {
    if (source.format === 'json') {
      return new JsonParser();
    } else {
      return new RegexParser();
    }
  }
}

export { JsonParser, RegexParser };
