# DevSkin Log Agent

Tail, parse, and ship logs to DevSkin - supports JSON, Nginx, Apache, Syslog, and custom formats.

## Features

- ✅ Real-time file tailing
- ✅ Multiple log format support (JSON, Nginx, Apache, Syslog, custom regex)
- ✅ Glob pattern support for multiple files
- ✅ Automatic log parsing and structured data extraction
- ✅ Batch shipping for efficiency
- ✅ Custom labels per source
- ✅ Graceful error handling
- ✅ Heartbeat monitoring

## Installation

```bash
npm install
npm run build
```

## Configuration

Create a `config.json` file:

```json
{
  "serverUrl": "https://api-monitoring.devskin.com",
  "apiKey": "your-api-key",
  "applicationName": "my-application",
  "environment": "production",
  "batchSize": 100,
  "flushInterval": 5000,
  "debug": false,
  "sources": [
    {
      "name": "app-logs",
      "path": "/var/log/myapp/app.log",
      "format": "json",
      "fromBeginning": false,
      "labels": {
        "component": "backend"
      }
    }
  ]
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `serverUrl` | string | *required* | DevSkin backend URL |
| `apiKey` | string | *required* | API key for authentication |
| `applicationName` | string | *required* | Application name |
| `environment` | string | undefined | Environment (production, staging, etc) |
| `batchSize` | number | 100 | Batch size for sending logs |
| `flushInterval` | number | 5000 | Flush interval in ms |
| `debug` | boolean | false | Enable debug logging |
| `sources` | array | *required* | Log sources to tail |

### Log Source Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | *required* | Unique name for this source |
| `path` | string | *required* | File path or glob pattern |
| `format` | string | undefined | Log format (json, nginx, apache, syslog, custom) |
| `parser` | string | undefined | Custom regex pattern (for format: custom) |
| `labels` | object | {} | Additional labels to attach |
| `fromBeginning` | boolean | false | Read from beginning of file |

## Supported Formats

### JSON

Automatically parses JSON logs and extracts common fields:

```json
{
  "timestamp": "2024-01-15T10:30:45Z",
  "level": "ERROR",
  "message": "Database connection failed",
  "user_id": "123",
  "request_id": "abc-def"
}
```

Config:
```json
{
  "name": "app-json",
  "path": "/var/log/app.log",
  "format": "json"
}
```

### Nginx Access Log

Parses standard Nginx access logs:

```
192.168.1.1 - - [15/Jan/2024:10:30:45 +0000] "GET /api/users HTTP/1.1" 200 1234 "https://example.com" "Mozilla/5.0"
```

Config:
```json
{
  "name": "nginx-access",
  "path": "/var/log/nginx/access.log",
  "format": "nginx"
}
```

### Apache Access Log

Parses standard Apache access logs:

```
192.168.1.1 - - [15/Jan/2024:10:30:45 +0000] "GET /index.html HTTP/1.1" 200 1234
```

Config:
```json
{
  "name": "apache-access",
  "path": "/var/log/apache2/access.log",
  "format": "apache"
}
```

### Syslog

Parses standard syslog format:

```
Jan 15 10:30:45 server1 myapp[1234]: Application started
```

Config:
```json
{
  "name": "syslog",
  "path": "/var/log/syslog",
  "format": "syslog"
}
```

### Custom Regex

Define your own regex pattern:

```
[2024-01-15 10:30:45] INFO: User logged in
```

Config:
```json
{
  "name": "custom-logs",
  "path": "/var/log/custom.log",
  "format": "custom",
  "parser": "^\\[(.+?)\\]\\s+(\\w+):\\s+(.+)$"
}
```

Named capture groups:
- Group 1: timestamp
- Group 2: level
- Group 3: message

## Usage

### Start the Agent

```bash
node dist/index.js --config config.json
```

### As a Service (systemd)

Create `/etc/systemd/system/devskin-log-agent.service`:

```ini
[Unit]
Description=DevSkin Log Agent
After=network.target

[Service]
Type=simple
User=devskin
WorkingDirectory=/opt/devskin-log-agent
ExecStart=/usr/bin/node /opt/devskin-log-agent/dist/index.js --config /etc/devskin/log-agent-config.json
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable devskin-log-agent
sudo systemctl start devskin-log-agent
sudo systemctl status devskin-log-agent
```

### With Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY dist ./dist
COPY config.json ./

CMD ["node", "dist/index.js"]
```

Build and run:

```bash
docker build -t devskin-log-agent .
docker run -d \
  -v /var/log:/var/log:ro \
  -v /path/to/config.json:/app/config.json \
  --name devskin-log-agent \
  devskin-log-agent
```

## Examples

### Monitor Application Logs (JSON)

```json
{
  "sources": [
    {
      "name": "app-backend",
      "path": "/var/log/myapp/backend.log",
      "format": "json",
      "labels": {
        "component": "backend",
        "environment": "production"
      }
    }
  ]
}
```

### Monitor Web Server Logs

```json
{
  "sources": [
    {
      "name": "nginx-access",
      "path": "/var/log/nginx/access.log",
      "format": "nginx",
      "labels": {
        "component": "webserver"
      }
    },
    {
      "name": "nginx-error",
      "path": "/var/log/nginx/error.log",
      "format": "common",
      "labels": {
        "component": "webserver",
        "severity": "error"
      }
    }
  ]
}
```

### Monitor Multiple Applications

```json
{
  "sources": [
    {
      "name": "all-app-logs",
      "path": "/var/log/apps/**/*.log",
      "format": "json",
      "labels": {
        "source": "applications"
      }
    }
  ]
}
```

## Troubleshooting

### Permission Denied

Ensure the agent has read permissions on log files:

```bash
sudo usermod -a -G adm devskin
sudo chmod g+r /var/log/nginx/access.log
```

### No Logs Being Sent

1. Check debug mode: Set `"debug": true` in config
2. Verify file paths exist: `ls -la /path/to/log`
3. Check agent logs: `tail -f devskin-log-agent.log`
4. Verify backend connectivity: `curl http://backend:3000/health`

### High Memory Usage

Reduce batch size and flush interval:

```json
{
  "batchSize": 50,
  "flushInterval": 3000
}
```

## License

MIT
