# SSH Connection Troubleshooting

This guide helps troubleshoot SSH connection issues with your captive portal router.

## What was fixed

The application now handles SSH connection issues gracefully and won't crash when the connection is lost. Here's what has been improved:

### 1. Error Handling
- SSH connection errors are now caught and logged instead of crashing the app
- Keepalive timeout errors no longer terminate the entire server
- Proper error responses for API endpoints when SSH is unavailable

### 2. Auto-Reconnection
- Automatic reconnection attempts when SSH connection is lost
- Configurable retry attempts (default: 5 attempts)
- Exponential backoff with 5-second delays between attempts

### 3. Connection Monitoring
- Background monitoring of SSH connection health
- Periodic connection checks every minute
- Automatic reconnection attempts when connection is unhealthy

### 4. Graceful Degradation
- Payment processing continues even if SSH is temporarily unavailable
- Users are notified when router functions are temporarily unavailable
- Server continues running and serving other endpoints

## New Endpoints

### Health Check
- `GET /health` - Check overall server health including SSH status

### SSH Management
- `GET /api/ssh/status` - Check SSH connection status
- `POST /api/ssh/reconnect` - Manually trigger SSH reconnection

### Router Status
- `GET /api/router/status` - Get router status (requires SSH)

## Configuration

### SSH Connection Settings
The SSH client now uses improved settings:
- Keepalive interval: 30 seconds (increased from 10)
- Connection timeout: 20 seconds
- Maximum reconnect attempts: 5
- Reconnect delay: 5 seconds

### Monitoring
- Connection health checks every 60 seconds
- Automatic reconnection attempts when connection fails
- Detailed logging of connection events

## Common Issues and Solutions

### 1. Keepalive Timeout
**Symptom:** Server logs "Keepalive timeout" errors
**Solution:** The app now handles these automatically with reconnection

### 2. Router Unreachable
**Symptom:** Initial SSH connection fails
**Solution:** 
- Check router IP/credentials in .env file
- Use `/api/ssh/status` to monitor connection
- Use `/api/ssh/reconnect` to manually retry

### 3. Intermittent Connection Loss
**Symptom:** SSH works sometimes but fails randomly
**Solution:** 
- Monitor with `/health` endpoint
- Connection will auto-recover within 5 minutes
- Payment processing continues normally

## Environment Variables

Make sure these are set in your `.env` file:
```
ROUTER_IP=your.router.ip
ROUTER_PORT=22
ROUTER_PASSWORD=your_password
```

## Logs to Monitor

The app now provides detailed logging for:
- SSH connection attempts
- Reconnection status
- Command execution failures
- Health check results

Look for these log messages:
- "SSH connected to router" - Successful connection
- "SSH connection error" - Connection problems
- "Attempting to reconnect" - Auto-recovery in progress
- "SSH connection restored" - Recovery successful
