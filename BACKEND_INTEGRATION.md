# Backend Integration Guide

This document explains how to integrate the WebSocket friend request system with your backend functions.

## Backend Functions

Your backend has these functions that emit WebSocket events:

```javascript
const acceptFriendRequestStatus = catchAsync(async (req, res) => {
  const fr = await userService.acceptFriendRequestStatus(req.params.id);
  const senderId = String(fr.user_id);
  const receiverId = String(fr.Friend_id);
  emitFriendRequestUpdated(senderId, receiverId, 'accepted');
  return res.json(fr);
});

const rejectFriendRequestStatus = catchAsync(async (req, res) => {
  const fr = await userService.rejectFriendRequestStatus(req.params.id);
  const senderId = String(fr.user_id);
  const receiverId = String(fr.Friend_id);
  emitFriendRequestUpdated(senderId, receiverId, 'rejected');
  return res.json(fr);
});
```

## WebSocket Event Integration

The frontend WebSocket service is now configured to handle the events emitted by your backend:

### 1. Event Handling

The service listens for these events:
- `friend_request:status_updated` - When a friend request status changes
- `friend_request:updated` - The event your backend emits

### 2. Frontend Updates

When your backend emits events, the frontend automatically:
- Updates the UI to reflect status changes
- Removes accepted/rejected requests from pending lists
- Updates sent request statuses
- Logs all events for debugging

### 3. Testing Integration

The new "Backend Integration Testing" section allows you to:
- Simulate backend events without running your actual backend
- Test how the frontend responds to status updates
- Verify the integration works correctly

## How It Works

1. **User accepts/rejects a friend request** in the frontend
2. **Frontend calls your backend API** (acceptFriendRequestStatus/rejectFriendRequestStatus)
3. **Your backend processes the request** and calls `emitFriendRequestUpdated()`
4. **WebSocket event is emitted** to all connected clients
5. **Frontend receives the event** and updates the UI automatically
6. **Real-time updates** are displayed to users

## Event Flow

```
Frontend Action → Backend API → emitFriendRequestUpdated() → WebSocket Event → Frontend Update
```

## Testing

1. **Start the React app**: `npm start` in `stripe-testing/`
2. **Start the WebSocket server**: `node websocket-server.js` in root
3. **Navigate to** `/websocket-tester`
4. **Connect with a user ID**
5. **Use the "Backend Integration Testing" section** to simulate events
6. **Observe real-time updates** in the UI

## Customization

You can modify the event handling in:
- `src/services/friendRequestWebSocketService.ts` - WebSocket logic
- `src/components/FriendRequestWebSocketTester.tsx` - UI updates
- `src/utils/backendEventSimulator.ts` - Event simulation

## Backend Requirements

Your backend needs to:
1. **Emit WebSocket events** after processing friend request actions
2. **Use the correct event names**: `friend_request:updated`
3. **Send the correct data structure**: `{ senderId, receiverId, status }`
4. **Handle authentication** for WebSocket connections

## Example Backend Event

```javascript
// After processing acceptFriendRequestStatus
emitFriendRequestUpdated(senderId, receiverId, 'accepted');

// After processing rejectFriendRequestStatus  
emitFriendRequestUpdated(senderId, receiverId, 'rejected');
```

This will automatically update all connected clients in real-time!

