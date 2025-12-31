"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTailer = void 0;
const tail_1 = require("tail");
const parsers_1 = require("../parsers");
const fs = __importStar(require("fs"));
/**
 * File tailer for following log files
 */
class FileTailer {
    constructor(source, onLog, onError) {
        this.tail = null;
        this.source = source;
        this.parser = parsers_1.ParserFactory.createParser(source);
        this.onLogCallback = onLog;
        this.onErrorCallback = onError;
    }
    /**
     * Start tailing the file
     */
    start() {
        // Check if file exists
        if (!fs.existsSync(this.source.path)) {
            this.onErrorCallback(new Error(`File not found: ${this.source.path}`));
            return;
        }
        try {
            this.tail = new tail_1.Tail(this.source.path, {
                fromBeginning: this.source.fromBeginning || false,
                follow: true,
                useWatchFile: false,
            });
            this.tail.on('line', (line) => {
                this.handleLine(line);
            });
            this.tail.on('error', (error) => {
                this.onErrorCallback(error);
            });
            console.log(`[FileTailer] Started tailing: ${this.source.path}`);
        }
        catch (error) {
            this.onErrorCallback(error);
        }
    }
    /**
     * Stop tailing the file
     */
    stop() {
        if (this.tail) {
            this.tail.unwatch();
            this.tail = null;
            console.log(`[FileTailer] Stopped tailing: ${this.source.path}`);
        }
    }
    /**
     * Handle a new log line
     */
    handleLine(line) {
        // Skip empty lines
        if (!line || line.trim().length === 0) {
            return;
        }
        try {
            const parsedLog = this.parser.parse(line, this.source);
            if (parsedLog) {
                this.onLogCallback(parsedLog);
            }
        }
        catch (error) {
            this.onErrorCallback(new Error(`Failed to parse line: ${error.message}`));
        }
    }
    /**
     * Get source name
     */
    getSourceName() {
        return this.source.name;
    }
}
exports.FileTailer = FileTailer;
//# sourceMappingURL=file.tailer.js.map