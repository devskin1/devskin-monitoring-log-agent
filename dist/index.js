#!/usr/bin/env node
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const agent_1 = require("./agent");
const fs = __importStar(require("fs"));
/**
 * Main entry point
 */
async function main() {
    const args = process.argv.slice(2);
    let configPath = 'config.json';
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--config' && args[i + 1]) {
            configPath = args[i + 1];
        }
    }
    // Load configuration
    let config;
    if (fs.existsSync(configPath)) {
        console.log(`Loading configuration from: ${configPath}`);
        const configData = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(configData);
    }
    else {
        console.error(`Configuration file not found: ${configPath}`);
        console.error('Please create a config.json file or specify --config <path>');
        process.exit(1);
    }
    // Validate configuration
    if (!config.serverUrl || !config.apiKey || !config.applicationName) {
        console.error('Error: serverUrl, apiKey, and applicationName are required');
        process.exit(1);
    }
    if (!config.sources || config.sources.length === 0) {
        console.error('Error: At least one log source is required');
        process.exit(1);
    }
    // Create and start agent
    const agent = new agent_1.LogAgent(config);
    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('Received SIGTERM, shutting down gracefully...');
        await agent.stop();
        process.exit(0);
    });
    process.on('SIGINT', async () => {
        console.log('Received SIGINT, shutting down gracefully...');
        await agent.stop();
        process.exit(0);
    });
    // Start the agent
    await agent.start();
    console.log('Log Agent is running. Press Ctrl+C to stop.');
}
// Run main
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
__exportStar(require("./agent"), exports);
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map