#!/usr/bin/env node

import { LogAgent } from './agent';
import { AgentConfig } from './types';
import * as fs from 'fs';

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
  let config: AgentConfig;

  if (fs.existsSync(configPath)) {
    console.log(`Loading configuration from: ${configPath}`);
    const configData = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(configData);
  } else {
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
  const agent = new LogAgent(config);

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

export * from './agent';
export * from './types';
