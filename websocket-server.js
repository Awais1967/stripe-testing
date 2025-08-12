const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Enable CORS
app.use(cors());

// Store connected users and friend requests
const connectedUsers = new Map();
const friendRequests = new Map();
let requestCounter = 1;

// Middleware to authenticate socket connections
io.use((socket, next) => {
  const { token, userId } = socket.handshake.auth;
  
  if (!userId) {
    return next(new Error('User ID is required'));
  }
  
  // In a real app, you would validate the token here
  if (!token) {
    return next(new Error('Auth token is required'));
  }
  
  socket.userId = userId;
  next();
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);
  connectedUsers.set(socket.userId, socket);

  // Send friend request
  socket.on('friend_request:send', async (data, callback) => {
    try {
      const { toUserId, message } = data;
      
      if (!toUserId) {
        return callback({ success: false, error: 'Target user ID is required' });
      }

      // Check if target user is online
      const targetSocket = connectedUsers.get(toUserId);
      if (!targetSocket) {
        return callback({ success: false, error: 'Target user is not online' });
      }

      // Create friend request
      const requestId = `req_${requestCounter++}`;
      const friendRequest = {
        id: requestId,
        fromUserId: socket.userId,
        toUserId: toUserId,
        status: 'pending',
        timestamp: new Date(),
        message: message
      };

      // Store the request
      friendRequests.set(requestId, friendRequest);

      // Send to sender
      callback({ success: true, request: friendRequest });

      // Send to receiver
      targetSocket.emit('friend_request:received', {
        type: 'received',
        request: friendRequest,
        message: message
      });

      console.log(`Friend request sent: ${socket.userId} -> ${toUserId}`);
    } catch (error) {
      console.error('Error sending friend request:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Accept friend request
  socket.on('friend_request:accept', async (data, callback) => {
    try {
      const { requestId } = data;
      
      if (!requestId) {
        return callback({ success: false, error: 'Request ID is required' });
      }

      const request = friendRequests.get(requestId);
      if (!request) {
        return callback({ success: false, error: 'Friend request not found' });
      }

      if (request.toUserId !== socket.userId) {
        return callback({ success: false, error: 'Not authorized to accept this request' });
      }

      // Update request status
      request.status = 'accepted';
      friendRequests.set(requestId, request);

      // Send to acceptor
      callback({ success: true, request: request });

      // Send to sender
      const senderSocket = connectedUsers.get(request.fromUserId);
      if (senderSocket) {
        senderSocket.emit('friend_request:accepted', {
          type: 'accepted',
          request: request
        });
      }

      console.log(`Friend request accepted: ${requestId}`);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Reject friend request
  socket.on('friend_request:reject', async (data, callback) => {
    try {
      const { requestId, reason } = data;
      
      if (!requestId) {
        return callback({ success: false, error: 'Request ID is required' });
      }

      const request = friendRequests.get(requestId);
      if (!request) {
        return callback({ success: false, error: 'Friend request not found' });
      }

      if (request.toUserId !== socket.userId) {
        return callback({ success: false, error: 'Not authorized to reject this request' });
      }

      // Update request status
      request.status = 'rejected';
      friendRequests.set(requestId, request);

      // Send to rejector
      callback({ success: true, request: request });

      // Send to sender
      const senderSocket = connectedUsers.get(request.fromUserId);
      if (senderSocket) {
        senderSocket.emit('friend_request:rejected', {
          type: 'rejected',
          request: request,
          reason: reason
        });
      }

      console.log(`Friend request rejected: ${requestId}`);
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Cancel friend request
  socket.on('friend_request:cancel', async (data, callback) => {
    try {
      const { requestId } = data;
      
      if (!requestId) {
        return callback({ success: false, error: 'Request ID is required' });
      }

      const request = friendRequests.get(requestId);
      if (!request) {
        return callback({ success: false, error: 'Friend request not found' });
      }

      if (request.fromUserId !== socket.userId) {
        return callback({ success: false, error: 'Not authorized to cancel this request' });
      }

      if (request.status !== 'pending') {
        return callback({ success: false, error: 'Can only cancel pending requests' });
      }

      // Remove the request
      friendRequests.delete(requestId);

      // Send to canceller
      callback({ success: true });

      // Send to receiver
      const receiverSocket = connectedUsers.get(request.toUserId);
      if (receiverSocket) {
        receiverSocket.emit('friend_request:cancelled', {
          type: 'cancelled',
          request: request
        });
      }

      console.log(`Friend request cancelled: ${requestId}`);
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Get pending requests
  socket.on('friend_request:pending', async (callback) => {
    try {
      const pendingRequests = Array.from(friendRequests.values())
        .filter(request => request.toUserId === socket.userId && request.status === 'pending');

      callback({ success: true, requests: pendingRequests });
      console.log(`Sent ${pendingRequests.length} pending requests to ${socket.userId}`);
    } catch (error) {
      console.error('Error getting pending requests:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
    connectedUsers.delete(socket.userId);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connectedUsers: connectedUsers.size,
    totalRequests: friendRequests.size
  });
});

// Get all friend requests (for debugging)
app.get('/requests', (req, res) => {
  res.json(Array.from(friendRequests.values()));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Debug requests: http://localhost:${PORT}/requests`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
