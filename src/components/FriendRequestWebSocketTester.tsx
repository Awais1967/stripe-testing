import React, { useState, useEffect, useCallback } from 'react';
import { 
  friendRequestWebSocket, 
  FriendRequest, 
  FriendRequestEvent 
} from '../services/friendRequestWebSocketService';
import BackendEventSimulator from '../utils/backendEventSimulator';
import './FriendRequestWebSocketTester.css';

const FriendRequestWebSocketTester: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState('user123');
  const [authToken, setAuthToken] = useState('test-token-123');
  const [targetUserId, setTargetUserId] = useState('user456');
  const [message, setMessage] = useState('');
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add log message
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  }, []);

  // Connect to WebSocket
  const handleConnect = async () => {
    if (!userId.trim()) {
      addLog('Error: User ID is required');
      return;
    }

    setIsLoading(true);
    try {
      await friendRequestWebSocket.connect(userId, authToken);
      setIsConnected(true);
      addLog(`Connected as user: ${userId}`);
      setupEventListeners();
    } catch (error) {
      addLog(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect from WebSocket
  const handleDisconnect = () => {
    friendRequestWebSocket.disconnect();
    setIsConnected(false);
    addLog('Disconnected from WebSocket server');
  };

  // Setup event listeners
  const setupEventListeners = () => {
    // Friend request received
    friendRequestWebSocket.on('friend_request:received', (data: FriendRequestEvent) => {
      addLog(`Received friend request from: ${data.request.fromUserName || data.request.fromUserId}`);
      setPendingRequests(prev => [data.request, ...prev]);
    });

    // Friend request accepted
    friendRequestWebSocket.on('friend_request:accepted', (data: FriendRequestEvent) => {
      addLog(`Friend request accepted by: ${data.request.toUserName || data.request.toUserId}`);
      setSentRequests(prev => prev.map(req => 
        req.id === data.request.id ? { ...req, status: 'accepted' } : req
      ));
    });

    // Friend request rejected
    friendRequestWebSocket.on('friend_request:rejected', (data: FriendRequestEvent) => {
      addLog(`Friend request rejected by: ${data.request.toUserName || data.request.toUserId}`);
      setSentRequests(prev => prev.map(req => 
        req.id === data.request.id ? { ...req, status: 'rejected' } : req
      ));
    });

    // Friend request cancelled
    friendRequestWebSocket.on('friend_request:cancelled', (data: FriendRequestEvent) => {
      addLog(`Friend request cancelled: ${data.request.id}`);
      setSentRequests(prev => prev.filter(req => req.id !== data.request.id));
    });

    // Status updated (from backend emitFriendRequestUpdated)
    friendRequestWebSocket.on('friend_request:status_updated', (data: FriendRequestEvent) => {
      addLog(`Friend request status updated: ${data.request.fromUserId} -> ${data.request.toUserId} -> ${data.status || data.request.status}`);
      
      // Update the UI based on the status change
      if (data.status === 'accepted' || data.request.status === 'accepted') {
        // Move from pending to accepted
        setPendingRequests(prev => prev.filter(req => 
          req.fromUserId === data.request.fromUserId && req.toUserId === data.request.toUserId
        ));
        
        // Update sent requests if this was a sent request
        setSentRequests(prev => prev.map(req => 
          (req.fromUserId === data.request.fromUserId && req.toUserId === data.request.toUserId) 
            ? { ...req, status: 'accepted' } 
            : req
        ));
      } else if (data.status === 'rejected' || data.request.status === 'rejected') {
        // Remove from pending requests
        setPendingRequests(prev => prev.filter(req => 
          req.fromUserId === data.request.fromUserId && req.toUserId === data.request.toUserId
        ));
        
        // Update sent requests if this was a sent request
        setSentRequests(prev => prev.map(req => 
          (req.fromUserId === data.request.fromUserId && req.toUserId === data.request.toUserId) 
            ? { ...req, status: 'rejected' } 
            : req
        ));
      }
    });
  };

  // Send friend request
  const handleSendRequest = async () => {
    if (!targetUserId.trim()) {
      addLog('Error: Target User ID is required');
      return;
    }

    setIsLoading(true);
    try {
      const request = await friendRequestWebSocket.sendFriendRequest(targetUserId, message);
      addLog(`Friend request sent to: ${targetUserId}`);
      setSentRequests(prev => [request, ...prev]);
      setMessage('');
    } catch (error) {
      addLog(`Failed to send friend request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Accept friend request
  const handleAcceptRequest = async (requestId: string) => {
    setIsLoading(true);
    try {
      await friendRequestWebSocket.acceptFriendRequest(requestId);
      addLog(`Accepted friend request: ${requestId}`);
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      addLog(`Failed to accept friend request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Reject friend request
  const handleRejectRequest = async (requestId: string) => {
    setIsLoading(true);
    try {
      await friendRequestWebSocket.rejectFriendRequest(requestId, 'User rejected');
      addLog(`Rejected friend request: ${requestId}`);
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      addLog(`Failed to reject friend request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel sent request
  const handleCancelRequest = async (requestId: string) => {
    setIsLoading(true);
    try {
      await friendRequestWebSocket.cancelFriendRequest(requestId);
      addLog(`Cancelled friend request: ${requestId}`);
      setSentRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      addLog(`Failed to cancel friend request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get pending requests
  const handleGetPendingRequests = async () => {
    setIsLoading(true);
    try {
      const requests = await friendRequestWebSocket.getPendingRequests();
      setPendingRequests(requests);
      addLog(`Retrieved ${requests.length} pending requests`);
    } catch (error) {
      addLog(`Failed to get pending requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear logs
  const handleClearLogs = () => {
    setLogs([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      friendRequestWebSocket.disconnect();
    };
  }, []);

  return (
    <div className="friend-request-tester">
      <h2>Friend Request WebSocket Tester</h2>
      
      {/* Connection Section */}
      <div className="connection-section">
        <h3>Connection</h3>
        <div className="form-group">
          <label>User ID:</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter your user ID"
            disabled={isConnected}
          />
        </div>
        <div className="form-group">
          <label>Auth Token:</label>
          <input
            type="text"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            placeholder="Enter auth token"
            disabled={isConnected}
          />
        </div>
        <div className="button-group">
          {!isConnected ? (
            <button 
              onClick={handleConnect} 
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? 'Connecting...' : 'Connect'}
            </button>
          ) : (
            <button 
              onClick={handleDisconnect}
              className="btn btn-danger"
            >
              Disconnect
            </button>
          )}
        </div>
        <div className="status">
          Status: <span className={isConnected ? 'connected' : 'disconnected'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Send Friend Request Section */}
      {isConnected && (
        <div className="send-request-section">
          <h3>Send Friend Request</h3>
          <div className="form-group">
            <label>Target User ID:</label>
            <input
              type="text"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="Enter target user ID"
            />
          </div>
          <div className="form-group">
            <label>Message (optional):</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter optional message"
            />
          </div>
          <button 
            onClick={handleSendRequest}
            disabled={isLoading}
            className="btn btn-success"
          >
            {isLoading ? 'Sending...' : 'Send Friend Request'}
          </button>
        </div>
      )}

      {/* Pending Requests Section */}
      {isConnected && (
        <div className="pending-requests-section">
          <h3>Pending Friend Requests</h3>
          <button 
            onClick={handleGetPendingRequests}
            disabled={isLoading}
            className="btn btn-info"
          >
            Refresh Pending Requests
          </button>
          <div className="requests-list">
            {pendingRequests.map(request => (
              <div key={request.id} className="request-item">
                <div className="request-info">
                  <strong>From:</strong> {request.fromUserName || request.fromUserId}
                  <br />
                  <strong>Time:</strong> {new Date(request.timestamp).toLocaleString()}
                </div>
                <div className="request-actions">
                  <button 
                    onClick={() => handleAcceptRequest(request.id)}
                    disabled={isLoading}
                    className="btn btn-success btn-sm"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleRejectRequest(request.id)}
                    disabled={isLoading}
                    className="btn btn-danger btn-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {pendingRequests.length === 0 && (
              <p>No pending friend requests</p>
            )}
          </div>
        </div>
      )}

      {/* Sent Requests Section */}
      {isConnected && (
        <div className="sent-requests-section">
          <h3>Sent Friend Requests</h3>
          <div className="requests-list">
            {sentRequests.map(request => (
              <div key={request.id} className="request-item">
                <div className="request-info">
                  <strong>To:</strong> {request.toUserName || request.toUserId}
                  <br />
                  <strong>Status:</strong> <span className={`status-${request.status}`}>{request.status}</span>
                  <br />
                  <strong>Time:</strong> {new Date(request.timestamp).toLocaleString()}
                </div>
                <div className="request-actions">
                  {request.status === 'pending' && (
                    <button 
                      onClick={() => handleCancelRequest(request.id)}
                      disabled={isLoading}
                      className="btn btn-warning btn-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
            {sentRequests.length === 0 && (
              <p>No sent friend requests</p>
            )}
          </div>
        </div>
      )}

      {/* Backend Integration Testing Section */}
      {isConnected && (
        <div className="backend-testing-section">
          <h3>Backend Integration Testing</h3>
          <p>This section simulates the events your backend would emit after calling:</p>
          <ul>
            <li><code>emitFriendRequestUpdated(senderId, receiverId, 'accepted')</code></li>
            <li><code>emitFriendRequestUpdated(senderId, receiverId, 'rejected')</code></li>
          </ul>
          
          <div className="backend-testing-controls">
            <div className="form-group">
              <label>Sender User ID:</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter sender user ID"
              />
            </div>
            <div className="form-group">
              <label>Receiver User ID:</label>
              <input
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Enter receiver user ID"
              />
            </div>
            
            <div className="button-group">
              <button 
                onClick={() => BackendEventSimulator.simulateAcceptFriendRequest(userId, targetUserId)}
                className="btn btn-success"
              >
                Simulate Accept (Backend Event)
              </button>
              <button 
                onClick={() => BackendEventSimulator.simulateRejectFriendRequest(userId, targetUserId)}
                className="btn btn-danger"
              >
                Simulate Reject (Backend Event)
              </button>
              <button 
                onClick={() => BackendEventSimulator.simulateMultipleUpdates()}
                className="btn btn-info"
              >
                Simulate Multiple Updates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Section */}
      <div className="logs-section">
        <h3>Event Logs</h3>
        <button onClick={handleClearLogs} className="btn btn-secondary">
          Clear Logs
        </button>
        <div className="logs-container">
          {logs.map((log, index) => (
            <div key={index} className="log-entry">
              {log}
            </div>
          ))}
          {logs.length === 0 && (
            <p>No logs yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendRequestWebSocketTester;
