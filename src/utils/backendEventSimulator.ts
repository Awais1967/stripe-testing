import { friendRequestWebSocket } from '../services/friendRequestWebSocketService';

/**
 * Utility to simulate backend events for testing purposes
 * This simulates the events that your backend would emit after
 * calling acceptFriendRequestStatus or rejectFriendRequestStatus
 */

export class BackendEventSimulator {
  /**
   * Simulate a friend request being accepted
   * This mimics what happens after your backend calls emitFriendRequestUpdated(senderId, receiverId, 'accepted')
   */
  static simulateAcceptFriendRequest(senderId: string, receiverId: string): void {
    console.log(`[Backend Simulator] Simulating friend request accepted: ${senderId} -> ${receiverId}`);
    
    // Simulate the backend emitting the event
    friendRequestWebSocket.handleBackendStatusUpdate(senderId, receiverId, 'accepted');
  }

  /**
   * Simulate a friend request being rejected
   * This mimics what happens after your backend calls emitFriendRequestUpdated(senderId, receiverId, 'rejected')
   */
  static simulateRejectFriendRequest(senderId: string, receiverId: string): void {
    console.log(`[Backend Simulator] Simulating friend request rejected: ${senderId} -> ${receiverId}`);
    
    // Simulate the backend emitting the event
    friendRequestWebSocket.handleBackendStatusUpdate(senderId, receiverId, 'rejected');
  }

  /**
   * Simulate multiple status updates for testing
   */
  static simulateMultipleUpdates(): void {
    console.log('[Backend Simulator] Simulating multiple status updates...');
    
    // Simulate some friend request status changes
    setTimeout(() => {
      this.simulateAcceptFriendRequest('user123', 'user456');
    }, 2000);
    
    setTimeout(() => {
      this.simulateRejectFriendRequest('user789', 'user123');
    }, 4000);
    
    setTimeout(() => {
      this.simulateAcceptFriendRequest('user456', 'user789');
    }, 6000);
  }
}

// Export for use in components
export default BackendEventSimulator;

