import { FriendRequestWebSocketService, FriendRequest, FriendRequestEvent } from '../friendRequestWebSocketService';
import { io, Socket } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');
const mockIo = io as jest.MockedFunction<typeof io>;

describe('FriendRequestWebSocketService', () => {
  let service: FriendRequestWebSocketService;
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock socket
    mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connected: true,
    } as any;

    // Mock io to return our mock socket
    mockIo.mockReturnValue(mockSocket);
    
    // Create new service instance
    service = new FriendRequestWebSocketService('http://localhost:3000');
  });

  afterEach(() => {
    service.disconnect();
  });

  describe('Connection Management', () => {
    it('should connect successfully', async () => {
      // Setup mock socket events
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          callback();
        }
        return mockSocket;
      });

      await service.connect('user123', 'token123');

      expect(mockIo).toHaveBeenCalledWith('http://localhost:3000', {
        auth: {
          token: 'token123',
          userId: 'user123'
        },
        transports: ['websocket', 'polling']
      });
      expect(service.getConnectionStatus()).toBe(true);
    });

    it('should handle connection errors', async () => {
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect_error') {
          callback(new Error('Connection failed'));
        }
        return mockSocket;
      });

      await expect(service.connect('user123')).rejects.toThrow('Connection failed');
      expect(service.getConnectionStatus()).toBe(false);
    });

    it('should disconnect properly', () => {
      service['socket'] = mockSocket;
      service['isConnected'] = true;

      service.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(service.getConnectionStatus()).toBe(false);
    });
  });

  describe('Friend Request Operations', () => {
    beforeEach(async () => {
      // Setup successful connection
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          callback();
        }
        return mockSocket;
      });
      await service.connect('user123');
    });

    it('should send friend request successfully', async () => {
      const mockRequest: FriendRequest = {
        id: 'req123',
        fromUserId: 'user123',
        toUserId: 'user456',
        status: 'pending',
        timestamp: new Date(),
        fromUserName: 'John Doe'
      };

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'friend_request:send') {
          callback({ success: true, request: mockRequest });
        }
        return mockSocket;
      });

      const result = await service.sendFriendRequest('user456', 'Hello!');

      expect(mockSocket.emit).toHaveBeenCalledWith('friend_request:send', { toUserId: 'user456', message: 'Hello!' }, expect.any(Function));
      expect(result).toEqual(mockRequest);
    });

    it('should handle send friend request failure', async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'friend_request:send') {
          callback({ success: false, error: 'User not found' });
        }
        return mockSocket;
      });

      await expect(service.sendFriendRequest('user456')).rejects.toThrow('User not found');
    });

    it('should accept friend request successfully', async () => {
      const mockRequest: FriendRequest = {
        id: 'req123',
        fromUserId: 'user456',
        toUserId: 'user123',
        status: 'accepted',
        timestamp: new Date()
      };

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'friend_request:accept') {
          callback({ success: true, request: mockRequest });
        }
        return mockSocket;
      });

      const result = await service.acceptFriendRequest('req123');

      expect(mockSocket.emit).toHaveBeenCalledWith('friend_request:accept', { requestId: 'req123' }, expect.any(Function));
      expect(result).toEqual(mockRequest);
    });

    it('should reject friend request successfully', async () => {
      const mockRequest: FriendRequest = {
        id: 'req123',
        fromUserId: 'user456',
        toUserId: 'user123',
        status: 'rejected',
        timestamp: new Date()
      };

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'friend_request:reject') {
          callback({ success: true, request: mockRequest });
        }
        return mockSocket;
      });

      const result = await service.rejectFriendRequest('req123', 'Not interested');

      expect(mockSocket.emit).toHaveBeenCalledWith('friend_request:reject', { requestId: 'req123', reason: 'Not interested' }, expect.any(Function));
      expect(result).toEqual(mockRequest);
    });

    it('should cancel friend request successfully', async () => {
      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'friend_request:cancel') {
          callback({ success: true });
        }
        return mockSocket;
      });

      await service.cancelFriendRequest('req123');

      expect(mockSocket.emit).toHaveBeenCalledWith('friend_request:cancel', { requestId: 'req123' }, expect.any(Function));
    });

    it('should get pending requests successfully', async () => {
      const mockRequests: FriendRequest[] = [
        {
          id: 'req123',
          fromUserId: 'user456',
          toUserId: 'user123',
          status: 'pending',
          timestamp: new Date(),
          fromUserName: 'Jane Doe'
        }
      ];

      mockSocket.emit.mockImplementation((event, data, callback) => {
        if (event === 'friend_request:pending') {
          callback({ success: true, requests: mockRequests });
        }
        return mockSocket;
      });

      const result = await service.getPendingRequests();

      expect(mockSocket.emit).toHaveBeenCalledWith('friend_request:pending', expect.any(Function));
      expect(result).toEqual(mockRequests);
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          callback();
        }
        return mockSocket;
      });
      await service.connect('user123');
    });

    it('should setup event listeners on connection', () => {
      expect(mockSocket.on).toHaveBeenCalledWith('friend_request:received', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('friend_request:accepted', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('friend_request:rejected', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('friend_request:cancelled', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('friend_request:status_updated', expect.any(Function));
    });

    it('should emit local events when WebSocket events are received', () => {
      const mockEvent: FriendRequestEvent = {
        type: 'received',
        request: {
          id: 'req123',
          fromUserId: 'user456',
          toUserId: 'user123',
          status: 'pending',
          timestamp: new Date()
        }
      };

      const mockCallback = jest.fn();
      service.on('friend_request:received', mockCallback);

      // Simulate WebSocket event
      const receivedCallback = mockSocket.on.mock.calls.find(call => call[0] === 'friend_request:received')?.[1];
      if (receivedCallback) {
        receivedCallback(mockEvent);
      }

      expect(mockCallback).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle multiple event listeners', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      service.on('friend_request:received', mockCallback1);
      service.on('friend_request:received', mockCallback2);

      const mockEvent: FriendRequestEvent = {
        type: 'received',
        request: {
          id: 'req123',
          fromUserId: 'user456',
          toUserId: 'user123',
          status: 'pending',
          timestamp: new Date()
        }
      };

      const receivedCallback = mockSocket.on.mock.calls.find(call => call[0] === 'friend_request:received')?.[1];
      if (receivedCallback) {
        receivedCallback(mockEvent);
      }

      expect(mockCallback1).toHaveBeenCalledWith(mockEvent);
      expect(mockCallback2).toHaveBeenCalledWith(mockEvent);
    });

    it('should remove event listeners', () => {
      const mockCallback = jest.fn();
      service.on('friend_request:received', mockCallback);
      service.off('friend_request:received', mockCallback);

      const mockEvent: FriendRequestEvent = {
        type: 'received',
        request: {
          id: 'req123',
          fromUserId: 'user456',
          toUserId: 'user123',
          status: 'pending',
          timestamp: new Date()
        }
      };

      const receivedCallback = mockSocket.on.mock.calls.find(call => call[0] === 'friend_request:received')?.[1];
      if (receivedCallback) {
        receivedCallback(mockEvent);
      }

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when trying to send request without connection', async () => {
      await expect(service.sendFriendRequest('user456')).rejects.toThrow('WebSocket not connected');
    });

    it('should throw error when trying to accept request without connection', async () => {
      await expect(service.acceptFriendRequest('req123')).rejects.toThrow('WebSocket not connected');
    });

    it('should throw error when trying to reject request without connection', async () => {
      await expect(service.rejectFriendRequest('req123')).rejects.toThrow('WebSocket not connected');
    });

    it('should throw error when trying to cancel request without connection', async () => {
      await expect(service.cancelFriendRequest('req123')).rejects.toThrow('WebSocket not connected');
    });

    it('should throw error when trying to get pending requests without connection', async () => {
      await expect(service.getPendingRequests()).rejects.toThrow('WebSocket not connected');
    });
  });

  describe('Connection Status', () => {
    it('should return correct connection status', () => {
      expect(service.getConnectionStatus()).toBe(false);
      
      service['isConnected'] = true;
      expect(service.getConnectionStatus()).toBe(true);
    });

    it('should return socket instance', () => {
      expect(service.getSocket()).toBeNull();
      
      service['socket'] = mockSocket;
      expect(service.getSocket()).toBe(mockSocket);
    });
  });

  describe('Event Listener Error Handling', () => {
    beforeEach(async () => {
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          callback();
        }
        return mockSocket;
      });
      await service.connect('user123');
    });

    it('should handle errors in event listeners gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockCallback = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });

      service.on('friend_request:received', mockCallback);

      const mockEvent: FriendRequestEvent = {
        type: 'received',
        request: {
          id: 'req123',
          fromUserId: 'user456',
          toUserId: 'user123',
          status: 'pending',
          timestamp: new Date()
        }
      };

      const receivedCallback = mockSocket.on.mock.calls.find(call => call[0] === 'friend_request:received')?.[1];
      if (receivedCallback) {
        receivedCallback(mockEvent);
      }

      expect(consoleSpy).toHaveBeenCalledWith('Error in event listener for friend_request:received:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});

