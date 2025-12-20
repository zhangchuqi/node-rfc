# RFC Server - HTTP API Wrapper

Express.js-based HTTP REST API server that wraps the node-rfc client for easy RFC communication over HTTP.

## Overview

This standalone application provides a REST API interface to SAP RFC functions, allowing HTTP clients to make RFC calls without needing direct SAP connectivity or the SAP NetWeaver RFC SDK installed on the client machine.

## Features

- **RFC Function Calls**: Execute any RFC function via HTTP POST
- **Connection Testing**: Test SAP connectivity with dedicated endpoint
- **Health Checks**: Monitor server status
- **Error Handling**: Proper HTTP status codes and error responses
- **CORS Support**: Cross-origin resource sharing enabled

## Installation

```bash
cd rfc-server
npm install
```

## Configuration

Set the following environment variables or create a `.env` file:

```bash
# SAP Connection Parameters
SAP_ASHOST=10.68.110.51
SAP_SYSNR=00
SAP_USER=demo
SAP_PASSWD=welcome
SAP_CLIENT=620
SAP_LANG=EN

# Server Configuration
PORT=3001
NODE_ENV=production
```

## Usage

### Starting the Server

```bash
npm start
```

The server will start on the configured PORT (default: 3001).

### Development Mode

```bash
npm run dev
```

Uses nodemon for automatic restarts on file changes.

## API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-20T10:30:00.000Z"
}
```

### Test SAP Connection

```http
POST /test
```

**Response:**
```json
{
  "success": true,
  "message": "SAP connection successful",
  "connectionInfo": {
    "dest": "...",
    "host": "...",
    "sysId": "PRD",
    "client": "620",
    "user": "DEMO"
  }
}
```

### Execute RFC Function

```http
POST /call/:functionName
```

**Parameters:**
- `functionName` (path): Name of the RFC function module to call

**Request Body:**
```json
{
  "REQUTEXT": "Hello SAP from HTTP!"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "ECHOTEXT": "Hello SAP from HTTP!",
    "RESPTEXT": "SAP NetWeaver..."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message details",
  "code": "RFC_ERROR_CODE"
}
```

## Examples

### Using cURL

```bash
# Test connection
curl -X POST http://localhost:3001/test

# Call RFC function
curl -X POST http://localhost:3001/call/STFC_CONNECTION \
  -H "Content-Type: application/json" \
  -d '{"REQUTEXT": "Hello from cURL"}'

# Read SAP table
curl -X POST http://localhost:3001/call/RFC_READ_TABLE \
  -H "Content-Type: application/json" \
  -d '{
    "QUERY_TABLE": "T001",
    "DELIMITER": "|",
    "ROWCOUNT": 10
  }'
```

### Using JavaScript/Fetch

```javascript
// Test connection
const testResponse = await fetch('http://localhost:3001/test', {
  method: 'POST'
});
const testData = await testResponse.json();
console.log('Connection:', testData);

// Call RFC function
const rfcResponse = await fetch('http://localhost:3001/call/STFC_CONNECTION', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ REQUTEXT: 'Hello SAP' })
});
const rfcData = await rfcResponse.json();
console.log('Result:', rfcData.result);
```

### Using Python

```python
import requests

# Test connection
response = requests.post('http://localhost:3001/test')
print(response.json())

# Call RFC function
response = requests.post(
    'http://localhost:3001/call/STFC_CONNECTION',
    json={'REQUTEXT': 'Hello from Python'}
)
result = response.json()
print(result['result'])
```

## Architecture

```
┌─────────────────┐
│  HTTP Client    │
│  (Browser/cURL) │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  Express Server │
│  (rfc-server)   │
└────────┬────────┘
         │ node-rfc
         ▼
┌─────────────────┐
│  SAP System     │
│  (RFC Server)   │
└─────────────────┘
```

## Error Handling

The server returns appropriate HTTP status codes:

- **200**: Successful RFC call
- **400**: Invalid request (missing parameters, invalid JSON)
- **500**: RFC error or connection failure
- **503**: SAP system unavailable

All errors include a JSON response with error details:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "RFC_ERROR_CODE",
  "key": "ERROR_KEY"
}
```

## Security Considerations

⚠️ **Important Security Notes:**

1. **Credentials**: Never commit SAP credentials to version control
2. **Network**: Use firewall rules to restrict access
3. **HTTPS**: Deploy behind reverse proxy with SSL/TLS in production
4. **Authentication**: Add API authentication (JWT, API keys) for production
5. **Rate Limiting**: Implement rate limiting to prevent abuse
6. **Input Validation**: Validate and sanitize all inputs

## Deployment

### Docker

Build and run with Docker:

```bash
docker build -f Dockerfile.rfc-server -t rfc-server .
docker run -p 3001:3001 --env-file .env rfc-server
```

### Railway

Deploy to Railway platform:

```bash
railway up
```

See [RAILWAY_DEPLOYMENT.md](../RAILWAY_DEPLOYMENT.md) for detailed deployment instructions.

### PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start index.js --name rfc-server
pm2 save
pm2 startup
```

## Monitoring

Monitor the server with:

```bash
# View logs
pm2 logs rfc-server

# Monitor resources
pm2 monit

# Application metrics
curl http://localhost:3001/health
```

## Troubleshooting

### Connection Errors

```
Error: RFC_COMMUNICATION_FAILURE
```

**Solutions:**
- Verify SAP system is reachable: `ping $SAP_ASHOST`
- Check firewall rules allow RFC port (33xx)
- Verify credentials are correct
- Ensure RFC SDK is properly installed

### Module Not Found

```
Error: Cannot find module 'node-rfc'
```

**Solution:**
```bash
cd ..
npm install
npm run build
cd rfc-server
npm install
```

### Port Already in Use

```
Error: listen EADDRINUSE :::3001
```

**Solution:**
```bash
# Find process using port
lsof -i :3001

# Kill process or change PORT in .env
export PORT=3002
npm start
```

## Development

### Adding New Endpoints

Edit `index.js` to add custom endpoints:

```javascript
// Custom RFC endpoint with validation
app.post('/api/get-user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }
    
    const result = await client.call('BAPI_USER_GET_DETAIL', {
      USERNAME: username
    });
    
    res.json({ success: true, user: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### Testing

Add tests using Jest or Mocha:

```javascript
// test/api.test.js
const request = require('supertest');
const app = require('../index');

describe('RFC Server API', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
  
  it('should call RFC function', async () => {
    const res = await request(app)
      .post('/call/STFC_CONNECTION')
      .send({ REQUTEXT: 'Test' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
```

## Related Documentation

- [Main node-rfc Documentation](../doc/README.md)
- [API Reference](../doc/api.md)
- [Authentication Guide](../doc/authentication.md)
- [Deployment Guide](../RAILWAY_DEPLOYMENT.md)

## License

Apache-2.0 - See [LICENSE](../LICENSE) file for details.
