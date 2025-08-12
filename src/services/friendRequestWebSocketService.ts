import { io, Socket } from 'socket.io-client';

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: Date;
  fromUserName?: string;
  toUserName?: string;
}

export interface FriendRequestEvent {
  type: 'sent' | 'received' | 'pending' | 'accepted' | 'rejected' | 'status_updated';
  request: FriendRequest;
  message?: string;
  status?: 'pending' | 'accepted' | 'rejected';
}

export class FriendRequestWebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(private serverUrl: string = 'http://localhost:3000') {}

  // Connect to WebSocket server
  connect(userId: string, authToken?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl, {
          auth: {
            token: authToken,
            userId: userId
          },
          transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
          console.log('Connected to friend request WebSocket server');
          this.isConnected = true;
          this.setupEventListeners();
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from WebSocket server');
          this.isConnected = false;
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Send friend request
  sendFriendRequest(toUserId: string, message?: string): Promise<FriendRequest> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('friend_request:send', { toUserId, message }, (response: any) => {
        if (response.success) {
          resolve(response.request);
        } else {
          reject(new Error(response.error || 'Failed to send friend request'));
        }
      });
    });
  }

  // Accept friend request
  acceptFriendRequest(requestId: string): Promise<FriendRequest> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('friend_request:accept', { requestId }, (response: any) => {
        if (response.success) {
          resolve(response.request);
        } else {
          reject(new Error(response.error || 'Failed to accept friend request'));
        }
      });
    });
  }

  // Reject friend request
  rejectFriendRequest(requestId: string, reason?: string): Promise<FriendRequest> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('friend_request:reject', { requestId, reason }, (response: any) => {
        if (response.success) {
          resolve(response.request);
        } else {
          reject(new Error(response.error || 'Failed to reject friend request'));
        }
      });
    });
  }

  // Cancel sent friend request
  cancelFriendRequest(requestId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('friend_request:cancel', { requestId }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to cancel friend request'));
        }
      });
    });
  }

  // Get pending friend requests
  getPendingRequests(): Promise<FriendRequest[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('friend_request:pending', (response: any) => {
        if (response.success) {
          resolve(response.requests);
        } else {
          reject(new Error(response.error || 'Failed to get pending requests'));
        }
      });
    });
  }

  // Setup event listeners for real-time updates
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Friend request received
    this.socket.on('friend_request:received', (data: FriendRequestEvent) => {
      this.emit('friend_request:received', data);
    });

    // Friend request accepted
    this.socket.on('friend_request:accepted', (data: FriendRequestEvent) => {
      this.emit('friend_request:accepted', data);
    });

    // Friend request rejected
    this.socket.on('friend_request:rejected', (data: FriendRequestEvent) => {
      this.emit('friend_request:rejected', data);
    });

    // Friend request cancelled
    this.socket.on('friend_request:cancelled', (data: FriendRequestEvent) => {
      this.emit('friend_request:cancelled', data);
    });

    // Friend request status updated (emitted by backend after accept/reject)
    this.socket.on('friend_request:status_updated', (data: FriendRequestEvent) => {
      this.emit('friend_request:status_updated', data);
    });

    // Handle backend emitFriendRequestUpdated events
    this.socket.on('friend_request:updated', (data: { 
      senderId: string; 
      receiverId: string; 
      status: 'accepted' | 'rejected' 
    }) => {
      // Create a FriendRequestEvent for the status update
      const eventData: FriendRequestEvent = {
        type: 'status_updated',
        request: {
          id: '', // Backend doesn't send request ID in this event
          fromUserId: data.senderId,
          toUserId: data.receiverId,
          status: data.status,
          timestamp: new Date()
        },
        status: data.status
      };
      this.emit('friend_request:status_updated', eventData);
    });
  }

  // Add event listener
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  // Remove event listener
  off(event: string, callback: Function): void {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit event to local listeners
  private emit(event: string, data: any): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Check connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Get socket instance (for advanced usage)
  getSocket(): Socket | null {
    return this.socket;
  }

  // Handle backend status updates (for integration with your backend functions)
  handleBackendStatusUpdate(senderId: string, receiverId: string, status: 'accepted' | 'rejected'): void {
    const eventData: FriendRequestEvent = {
      type: 'status_updated',
      request: {
        id: '', // Backend doesn't send request ID in this event
        fromUserId: senderId,
        toUserId: receiverId,
        status: status,
        timestamp: new Date()
      },
      status: status
    };
    
    // Emit the status update event locally
    this.emit('friend_request:status_updated', eventData);
  }
}

// Export singleton instance
export const friendRequestWebSocket = new FriendRequestWebSocketService();
