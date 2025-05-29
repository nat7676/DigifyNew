# Socket Communication Debug Logging

## Overview

Both DigifyOld and DigifyNew now have comprehensive logging for all socket communication with the server. This makes it easy to debug issues and understand the flow of data.

## How to Use

1. Open the browser console (F12)
2. The logs are color-coded and grouped for easy reading:
   - 🔵 **Blue (Request)**: Outgoing requests to the server
   - 🟢 **Green (Response)**: Successful responses from the server
   - 🔴 **Red (Error)**: Error responses or connection issues
   - 🟠 **Orange (Event)**: The specific event type being sent/received

3. Click on the collapsed log entries to expand and see detailed information

## Log Format

### Request Log
```
⬆️ REQUEST [OLD/NEW] Api abc12345... 14:23:45
```
- Shows the event type (e.g., Api, AccessToken, etc.)
- First 8 characters of the GUID for tracking
- Timestamp

### Response Log
```
⬇️ RESPONSE [OLD/NEW] Api abc12345... 125ms 14:23:45
```
- Shows the event type
- First 8 characters of the GUID (matches the request)
- Response time in milliseconds
- Timestamp

### Connection Log
```
🟢 SOCKET [OLD/NEW] CONNECTED wss://napi.digify.no:443
```
- Shows connection status
- Server URL

## What's Logged

1. **Request Details**:
   - Event type
   - Full GUID
   - Complete request data
   - Pretty-printed JSON

2. **Response Details**:
   - Event type
   - Full GUID
   - Response time
   - Complete response data
   - Pretty-printed JSON

3. **Error Details**:
   - Event type
   - Full GUID
   - Error message
   - Stack trace (if available)
   - Response time

## Example Output

When you login, you'll see:
1. Connection logs showing socket connections
2. Request log for the login API call
3. Response log with the token
4. Request log for AccessToken event
5. Response acknowledgment

## Tips

- Use the GUID to match requests with responses
- Look at response times to identify performance issues
- Check error logs for detailed error information
- The [OLD] and [NEW] tags help distinguish between the two applications

## Filtering

To see only logs from one application:
- DigifyOld: Look for `[OLD]` in the logs
- DigifyNew: Look for logs without `[OLD]` tag

You can also filter in the console using:
```javascript
// Show only requests
console.log.filter = (msg) => msg.includes('REQUEST')

// Show only errors
console.log.filter = (msg) => msg.includes('ERROR')
```