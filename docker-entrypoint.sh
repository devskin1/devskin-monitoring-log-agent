#!/bin/sh
set -e

# Generate config.json from environment variables
cat > /app/config/config.json <<EOF
{
  "serverUrl": "${DEVSKIN_SERVER_URL:-https://api-monitoring.devskin.com}",
  "apiKey": "${DEVSKIN_API_KEY}",
  "applicationName": "${DEVSKIN_APP_NAME:-log-agent}",
  "environment": "${DEVSKIN_ENVIRONMENT:-production}",
  "batchSize": ${DEVSKIN_BATCH_SIZE:-100},
  "flushInterval": ${DEVSKIN_FLUSH_INTERVAL:-5000},
  "debug": ${DEVSKIN_DEBUG:-false},
  "sources": [
    {
      "name": "${LOG_SOURCE_NAME:-app-logs}",
      "path": "${LOG_SOURCE_PATH:-/var/log/app.log}",
      "format": "${LOG_SOURCE_FORMAT:-json}",
      "fromBeginning": ${LOG_SOURCE_FROM_BEGINNING:-false},
      "labels": {
        "component": "${LOG_SOURCE_LABEL:-default}"
      }
    }
  ]
}
EOF

echo "Configuration generated successfully"
cat /app/config/config.json

# Start the agent
exec node dist/index.js --config /app/config/config.json
