"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegexParser = exports.JsonParser = exports.ParserFactory = void 0;
const json_parser_1 = require("./json.parser");
Object.defineProperty(exports, "JsonParser", { enumerable: true, get: function () { return json_parser_1.JsonParser; } });
const regex_parser_1 = require("./regex.parser");
Object.defineProperty(exports, "RegexParser", { enumerable: true, get: function () { return regex_parser_1.RegexParser; } });
/**
 * Parser factory
 */
class ParserFactory {
    static createParser(source) {
        if (source.format === 'json') {
            return new json_parser_1.JsonParser();
        }
        else {
            return new regex_parser_1.RegexParser();
        }
    }
}
exports.ParserFactory = ParserFactory;
//# sourceMappingURL=index.js.map