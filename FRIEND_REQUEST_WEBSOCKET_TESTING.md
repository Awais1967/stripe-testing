# Friend Request WebSocket Testing System

This system provides comprehensive testing capabilities for WebSocket-based friend request functionality, including send, receive, pending, accept, reject, and cancel operations.

## Features

- **Real-time WebSocket communication** using Socket.IO
- **Complete friend request lifecycle** management
- **Interactive testing interface** with React components
- **Comprehensive unit tests** for all functionality
- **Event-driven architecture** with proper error handling
- **Authentication support** for secure connections

## Architecture

```
┌─────────────────┐    WebSocket    ┌──────────────────┐
│   React Client  │ ◄─────────────► │  Node.js Server  │
│   (Port 3000)   │                 │   (Port 3000)    │
└─────────────────┘                 └──────────────────┘
```

## Components

### 1. WebSocket Service (`src/services/friendRequestWebSocketService.ts`)
- Handles all WebSocket connections and operations
- Provides clean API for friend request operations
- Manages event listeners and error handling
- Supports authentication and connection management

### 2. React Testing Component (`src/components/FriendRequestWebSocketTester.tsx`)
- Interactive UI for testing all WebSocket operations
- Real-time display of friend requests and events
- Connection management interface
- Comprehensive logging system

### 3. WebSocket Server (`websocket-server.js`)
- Node.js server with Socket.IO
- Handles all friend request operations
- Provides REST endpoints for debugging
- Supports multiple concurrent users

### 4. Unit Tests (`src/services/__tests__/friendRequestWebSocketService.test.ts`)
- Comprehensive test coverage for all functionality
- Mocked WebSocket connections for isolated testing
- Error handling and edge case testing

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### 1. Install Dependencies

```bash
# Install React app dependencies
cd stripe-testing
npm install

# Install WebSocket server dependencies
npm install express socket.io cors
npm install --save-dev nodemon
```

### 2. Start the WebSocket Server

```bash
# Start the server
node websocket-server.js

# Or use nodemon for development (auto-restart on changes)
npx nodemon websocket-server.js
```

The server will start on port 3000.

### 3. Start the React Application

```bash
# In a new terminal
npm start
```

The React app will start on port 3000.

### 4. Access the Testing Interface

Open your browser and navigate to:
- **React App**: http://localhost:3000
- **WebSocket Server Health**: http://localhost:3000/health
- **Debug Requests**: http://localhost:3000/requests

## Usage Guide

### 1. Connection Setup
1. Open the React testing interface
2. Enter your User ID (e.g., "user123")
3. Enter an Auth Token (e.g., "test-token-123")
4. Click "Connect" to establish WebSocket connection

### 2. Testing Friend Request Operations

#### Send Friend Request
1. Ensure you're connected
2. Enter target User ID (e.g., "user456")
3. Optionally add a message
4. Click "Send Friend Request"

#### Accept/Reject Requests
1. When you receive a friend request, it appears in "Pending Friend Requests"
2. Click "Accept" or "Reject" to respond
3. The sender will be notified of your decision

#### Cancel Sent Requests
1. View your sent requests in "Sent Friend Requests"
2. Click "Cancel" on pending requests to withdraw them

#### Monitor Real-time Events
- All WebSocket events are logged in real-time
- View connection status and request states
- Monitor pending and sent requests

### 3. Multi-User Testing

To test with multiple users:
1. Open multiple browser tabs/windows
2. Connect each with different User IDs
3. Send friend requests between users
4. Observe real-time updates across all sessions

## API Reference

### WebSocket Events

#### Client → Server
- `friend_request:send` - Send friend request
- `friend_request:accept` - Accept friend request
- `friend_request:reject` - Reject friend request
- `friend_request:cancel` - Cancel sent request
- `friend_request:pending` - Get pending requests

#### Server → Client
- `friend_request:received` - New friend request received
- `friend_request:accepted` - Request accepted by recipient
- `friend_request:rejected` - Request rejected by recipient
- `friend_request:cancelled` - Request cancelled by sender
- `friend_request:status_updated` - Request status changed

### REST Endpoints

- `GET /health` - Server health and statistics
- `GET /requests` - All friend requests (debug)

## Testing Scenarios

### 1. Basic Friend Request Flow
1. User A connects as "user123"
2. User B connects as "user456"
3. User A sends friend request to User B
4. User B receives notification
5. User B accepts/rejects request
6. User A receives response

### 2. Error Handling
- Try sending request to non-existent user
- Attempt operations without connection
- Test with invalid data

### 3. Edge Cases
- Multiple simultaneous requests
- Rapid accept/reject operations
- Connection interruptions
- Invalid user IDs or tokens

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- friendRequestWebSocketService.test.ts
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Ensure WebSocket server is running on port 3000
   - Check CORS settings
   - Verify User ID and Auth Token

2. **Events Not Received**
   - Check browser console for errors
   - Verify WebSocket connection status
   - Ensure event listeners are properly set up

3. **Server Errors**
   - Check server console for error messages
   - Verify all dependencies are installed
   - Check port availability

### Debug Mode

Enable debug logging:
```javascript
// In browser console
localStorage.setItem('debug', 'socket.io-client:*');
```

## Customization

### Adding New Events
1. Extend the `FriendRequestEvent` interface
2. Add event handler in the service
3. Update the React component
4. Add corresponding server-side logic

### Modifying Authentication
1. Update the server middleware
2. Modify client connection parameters
3. Add token validation logic

### Database Integration
1. Replace in-memory storage with database
2. Add persistence for friend requests
3. Implement user management

## Performance Considerations

- WebSocket connections are persistent
- Event listeners are properly managed
- Connection pooling for multiple users
- Efficient event broadcasting

## Security Notes

- This is a testing system - not production-ready
- Add proper authentication in production
- Implement rate limiting
- Add input validation and sanitization
- Use HTTPS in production

## Contributing

1. Follow the existing code structure
2. Add tests for new functionality
3. Update documentation
4. Ensure error handling is comprehensive

## License

MIT License - see LICENSE file for details

