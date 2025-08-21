import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import websocketService, { StreamParticipant, StreamMessage, ChallengeInfo } from '../services/websocketService';

interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  message: string;
  timestamp: number;
}

const LiveVideoStream: React.FC = () => {
  const { challengeId, userId, opponentId } = useParams<{ challengeId: string; userId: string; opponentId?: string }>();
  const navigate = useNavigate();
  
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<StreamParticipant[]>([]);
  const [challenge, setChallenge] = useState<ChallengeInfo | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isViewer, setIsViewer] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [reactions, setReactions] = useState<{ id: string; emoji: string; x: number; y: number }[]>([]);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // WebRTC configuration
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (!challengeId || !userId) {
      setError('Missing challenge ID or user ID');
      return;
    }

    initializeStream();
    return () => {
      cleanup();
    };
  }, [challengeId, userId]);

  const initializeStream = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Connect to WebSocket
      if (!userId) {
        setError('User ID is required');
        return;
      }
      await websocketService.connect(userId);
      setIsConnected(true);

      // Set up event listeners
      websocketService.onMessage(handleStreamMessage);
      websocketService.onParticipantUpdate(handleParticipantUpdate);
      websocketService.onChallengeUpdate(handleChallengeUpdate);

      // Join the challenge
      if (!challengeId) {
        setError('Challenge ID is required');
        return;
      }
      const isViewerMode = !opponentId; // If no opponent, user is a viewer
      websocketService.joinChallenge(challengeId, userId, opponentId, isViewerMode);
      
      setIsViewer(isViewerMode);
      setIsHost(!isViewerMode && !!opponentId);

      // Get user media if not a viewer
      if (!isViewerMode) {
        await getUserMedia();
      }

    } catch (err: any) {
      console.error('Failed to initialize stream:', err);
      setError('Failed to connect to stream');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });

      setLocalStream(stream);
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Failed to get user media:', err);
      setError('Failed to access camera/microphone');
    }
  };

  const handleStreamMessage = useCallback((message: StreamMessage) => {
    console.log('Received message:', message);

    switch (message.type) {
      case 'offer':
        handleOffer(message.from, message.data);
        break;
      case 'answer':
        handleAnswer(message.from, message.data);
        break;
      case 'ice-candidate':
        handleIceCandidate(message.from, message.data);
        break;
      case 'chat':
        handleChatMessage(message);
        break;
      case 'viewer-joined':
        handleViewerJoined(message.data);
        break;
      case 'viewer-left':
        handleViewerLeft(message.data);
        break;
      case 'live-reaction': {
        const payload = message.data as { emoji: string; position: { x: number; y: number } };
        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const x = Math.max(0, Math.min(1, payload.position?.x ?? Math.random()));
        const y = Math.max(0, Math.min(1, payload.position?.y ?? Math.random()));
        setReactions(prev => [...prev.slice(-9), { id, emoji: payload.emoji, x, y }]);
        break;
      }
    }
  }, []);

  const handleParticipantUpdate = useCallback((participants: StreamParticipant[]) => {
    console.log('Participants updated:', participants);
    setParticipants(participants);
  }, []);

  const handleChallengeUpdate = useCallback((challenges: ChallengeInfo[]) => {
    const currentChallenge = challenges.find(c => c.challengeId === challengeId);
    if (currentChallenge) {
      setChallenge(currentChallenge);
    }
  }, [challengeId]);

  const handleOffer = async (from: string, offer: RTCSessionDescriptionInit) => {
    try {
      const peerConnection = createPeerConnection(from);
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current!);
        });
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      websocketService.sendAnswer(from, answer);
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  };

  const handleAnswer = async (from: string, answer: RTCSessionDescriptionInit) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(from);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  };

  const handleIceCandidate = async (from: string, candidate: RTCIceCandidateInit) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(from);
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error('Error handling ICE candidate:', err);
    }
  };

  const handleChatMessage = (message: StreamMessage) => {
    const chatMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: message.from,
      displayName: participants.find(p => p.userId === message.from)?.displayName || 'Unknown',
      message: message.data.message,
      timestamp: message.timestamp
    };
    setChatMessages(prev => [...prev, chatMessage]);
  };

  const handleViewerJoined = (data: { userId: string; displayName: string }) => {
    console.log('Viewer joined:', data);
  };

  const handleViewerLeft = (data: { userId: string }) => {
    console.log('Viewer left:', data);
  };

  const createPeerConnection = (participantId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    peerConnectionsRef.current.set(participantId, peerConnection);

    peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event);
      setRemoteStreams(prev => new Map(prev.set(participantId, event.streams[0])));
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        websocketService.sendIceCandidate(participantId, event.candidate);
      }
    };

    return peerConnection;
  };

  const sendChatMessage = () => {
    if (!newChatMessage.trim()) return;
    if (!challengeId) return;

    websocketService.sendChatMessage(newChatMessage, challengeId);
    setNewChatMessage('');
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  };

  const sendReaction = (emoji: string) => {
    if (!challengeId) return;
    // Randomize a nice floating position
    const pos = { x: Math.random(), y: Math.random() * 0.6 + 0.1 };
    websocketService.sendLiveReaction(challengeId, emoji, pos);
    // Also render locally for instant feedback
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setReactions(prev => [...prev.slice(-9), { id, emoji, x: pos.x, y: pos.y }]);
    // Auto-clear oldest after a short delay
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  const leaveStream = () => {
    if (challengeId && userId) {
      websocketService.leaveChallenge(challengeId, userId);
    }
    cleanup();
    navigate('/challenges');
  };

  const cleanup = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close peer connections
    peerConnectionsRef.current.forEach(connection => {
      connection.close();
    });
    peerConnectionsRef.current.clear();

    // Disconnect WebSocket
    websocketService.disconnect();
  };

  if (isLoading) {
    return (
      <div className="stream-loading">
        <div className="loading-spinner"></div>
        <p>Connecting to stream...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stream-error">
        <h3>Connection Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="live-stream-container">
      <div className="stream-header">
        <h2>Live Challenge Stream</h2>
        <div className="stream-info">
          {challenge && (
            <div className="challenge-details">
              <h3>{challenge.title}</h3>
              <p>{challenge.description}</p>
              <span className="status">{challenge.status}</span>
              <span className="viewers">{challenge.viewers} viewers</span>
            </div>
          )}
        </div>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="stream-content">
        {/* Reactions overlay */}
        <div className="reactions-overlay" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {reactions.map(r => (
            <div key={r.id} style={{ position: 'absolute', left: `${r.x * 100}%`, top: `${r.y * 100}%`, transform: 'translate(-50%, -50%)', fontSize: 28 }}>
              {r.emoji}
            </div>
          ))}
        </div>
        <div className="video-grid">
          {/* Local video */}
          {!isViewer && localStream && (
            <div className="video-container local">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="video-stream"
              />
              <div className="video-overlay">
                <span className="participant-name">You</span>
                <div className="video-controls">
                  <button onClick={toggleMute} className="control-btn">
                    🎤
                  </button>
                  <button onClick={toggleVideo} className="control-btn">
                    📹
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Remote videos */}
          {Array.from(remoteStreams.entries()).map(([participantId, stream]) => (
            <div key={participantId} className="video-container remote">
              <video
                ref={(el) => {
                  if (el) {
                    el.srcObject = stream;
                    remoteVideosRef.current.set(participantId, el);
                  }
                }}
                autoPlay
                playsInline
                className="video-stream"
              />
              <div className="video-overlay">
                <span className="participant-name">
                  {participants.find(p => p.userId === participantId)?.displayName || 'Unknown'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="stream-sidebar">
          <div className="participants-section">
            <h3>Participants ({participants.length})</h3>
            <div className="participants-list">
              {participants.map(participant => (
                <div key={participant.userId} className="participant-item">
                  <div className="participant-avatar">
                    {participant.avatar ? (
                      <img src={participant.avatar} alt={participant.displayName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {participant.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="participant-info">
                    <span className="participant-name">{participant.displayName}</span>
                    <span className="participant-role">
                      {participant.isHost ? 'Host' : participant.isViewer ? 'Viewer' : 'Participant'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chat-section">
            <h3>Live Chat</h3>
            <div className="chat-messages">
              {chatMessages.map(message => (
                <div key={message.id} className="chat-message">
                  <span className="message-author">{message.displayName}:</span>
                  <span className="message-text">{message.message}</span>
                  <span className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              />
              <button onClick={sendChatMessage}>Send</button>
            </div>
          </div>
        </div>
      </div>

      <div className="stream-controls">
        <div className="reactions-controls" style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => sendReaction('❤️')}>❤️</button>
          <button onClick={() => sendReaction('🔥')}>🔥</button>
          <button onClick={() => sendReaction('👏')}>👏</button>
          <button onClick={() => sendReaction('👍')}>👍</button>
        </div>
        <button onClick={leaveStream} className="leave-btn">
          Leave Stream
        </button>
      </div>
    </div>
  );
};

export default LiveVideoStream; 