import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import websocketService, { StreamMessage } from '../services/websocketService';

interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  message: string;
}

const ScreenShare: React.FC = () => {
  const { userId: targetUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [isConnected, setIsConnected] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [error, setError] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [reactions, setReactions] = useState<{ id: string; emoji: string; x: number; y: number }[]>([]);

  const localScreenRef = useRef<HTMLVideoElement>(null);
  const remoteScreenRef = useRef<HTMLVideoElement>(null);
  const screenPeerRef = useRef<RTCPeerConnection | null>(null);
  const localDisplayStreamRef = useRef<MediaStream | null>(null);

  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    const run = async () => {
      try {
        setError('');
        const userData = localStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : null;
        const userId = user?._id || user?.id;
        if (!userId) {
          setError('Not logged in');
          return;
        }
        await websocketService.connect(userId);
        setIsConnected(true);
        websocketService.onMessage(handleWsMessage);
        if (!targetUserId) {
          setError('Missing userId');
          return;
        }
        // Join screen room keyed by target user id as viewer by default
        websocketService.screenJoin(targetUserId, 'viewer');
      } catch (e: any) {
        setError(e?.message || 'Failed to connect');
      }
    };
    run();
    return () => cleanup();
  }, [targetUserId]);

  const handleWsMessage = useCallback((message: StreamMessage) => {
    switch (message.type) {
      case 'screen-offer':
        handleScreenOffer(message.data);
        break;
      case 'screen-answer':
        handleScreenAnswer(message.data);
        break;
      case 'screen-ice':
        handleScreenIce(message.data);
        break;
      case 'screen-stopped':
        if (remoteScreenRef.current) remoteScreenRef.current.srcObject = null;
        break;
      case 'chat': {
        const payload = message.data || {};
        const chat: ChatMessage = {
          id: payload.id || Date.now().toString(),
          userId: message.from,
          displayName: payload.displayName || 'Unknown',
          message: payload.message || '',
        };
        setChatMessages((prev) => [...prev, chat]);
        break;
      }
      case 'live-reaction': {
        const payload = message.data as { emoji: string; position: { x: number; y: number } };
        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const x = Math.max(0, Math.min(1, payload.position?.x ?? Math.random()));
        const y = Math.max(0, Math.min(1, payload.position?.y ?? Math.random()));
        setReactions((prev) => [...prev.slice(-9), { id, emoji: payload.emoji, x, y }]);
        break;
      }
    }
  }, []);

  const handleScreenOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      const peer = new RTCPeerConnection(rtcConfig);
      screenPeerRef.current = peer;
      peer.ontrack = (event) => {
        if (remoteScreenRef.current) remoteScreenRef.current.srcObject = event.streams[0];
      };
      peer.onicecandidate = (event) => {
        if (event.candidate) websocketService.screenSendIce(event.candidate, targetUserId);
      };
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      websocketService.screenSendAnswer(answer, targetUserId);
    } catch (e) {
      console.error('Error handling screen offer:', e);
    }
  };

  const handleScreenAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      const peer = screenPeerRef.current;
      if (peer) await peer.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (e) {
      console.error('Error handling screen answer:', e);
    }
  };

  const handleScreenIce = async (candidate: RTCIceCandidateInit) => {
    try {
      const peer = screenPeerRef.current;
      if (peer) await peer.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error('Error handling screen ICE:', e);
    }
  };

  const startPresenting = async () => {
    if (!targetUserId) return;
    try {
      const displayStream: MediaStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false });
      localDisplayStreamRef.current = displayStream;
      if (localScreenRef.current) localScreenRef.current.srcObject = displayStream;
      setIsPresenting(true);
      websocketService.screenJoin(targetUserId, 'presenter');

      const peer = new RTCPeerConnection(rtcConfig);
      screenPeerRef.current = peer;
      displayStream.getTracks().forEach((track: MediaStreamTrack) => peer.addTrack(track, displayStream));
      peer.onicecandidate = (event) => {
        if (event.candidate) websocketService.screenSendIce(event.candidate, targetUserId);
      };
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      websocketService.screenSendOffer(offer, targetUserId);

      const [videoTrack] = displayStream.getVideoTracks();
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => stopPresenting());
      }
    } catch (e) {
      console.error('Failed to start presenting:', e);
      setIsPresenting(false);
      localDisplayStreamRef.current = null;
      if (localScreenRef.current) localScreenRef.current.srcObject = null;
    }
  };

  const stopPresenting = () => {
    try {
      if (localDisplayStreamRef.current) {
        localDisplayStreamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      }
      websocketService.screenStop(targetUserId);
      websocketService.screenLeave(targetUserId!);
    } finally {
      setIsPresenting(false);
      localDisplayStreamRef.current = null;
      if (localScreenRef.current) localScreenRef.current.srcObject = null;
      if (screenPeerRef.current) {
        screenPeerRef.current.close();
        screenPeerRef.current = null;
      }
    }
  };

  const sendChatMessage = () => {
    if (!newChatMessage.trim() || !targetUserId) return;
    websocketService.sendScreenChat(newChatMessage, targetUserId);
    setNewChatMessage('');
  };

  const sendReaction = (emoji: string) => {
    if (!targetUserId) return;
    const pos = { x: Math.random(), y: Math.random() * 0.6 + 0.1 };
    websocketService.sendScreenReaction(emoji, pos, targetUserId);
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setReactions((prev) => [...prev.slice(-9), { id, emoji, x: pos.x, y: pos.y }]);
    setTimeout(() => setReactions((prev) => prev.filter((r) => r.id !== id)), 2000);
  };

  const cleanup = () => {
    try {
      if (localDisplayStreamRef.current) {
        localDisplayStreamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      }
      if (screenPeerRef.current) {
        screenPeerRef.current.close();
        screenPeerRef.current = null;
      }
      if (targetUserId) websocketService.screenLeave(targetUserId);
      websocketService.disconnect();
    } catch {}
  };

  return (
    <div className="screen-share-page" style={{ padding: 16 }}>
      <h2>Screen Share</h2>
      <div className="connection-status">
        <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Reactions overlay */}
      <div className="reactions-overlay" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {reactions.map((r) => (
          <div key={r.id} style={{ position: 'absolute', left: `${r.x * 100}%`, top: `${r.y * 100}%`, transform: 'translate(-50%, -50%)', fontSize: 28 }}>
            {r.emoji}
          </div>
        ))}
      </div>

      <div className="screen-share-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        {/* Presenter local preview */}
        {isPresenting && (
          <div>
            <h4>Your Screen (Preview)</h4>
            <video ref={localScreenRef} autoPlay playsInline muted style={{ width: '100%', background: '#000', borderRadius: 8 }} />
          </div>
        )}
        {/* Remote screen */}
        <div>
          <h4>Live Screen</h4>
          <video ref={remoteScreenRef} autoPlay playsInline style={{ width: '100%', background: '#000', borderRadius: 8 }} />
        </div>
      </div>

      <div className="controls" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {!isPresenting ? (
          <button onClick={startPresenting} className="control-btn">Start Presenting</button>
        ) : (
          <button onClick={stopPresenting} className="leave-btn">Stop Presenting</button>
        )}
        <button onClick={() => navigate('/challenges')} className="leave-btn">Back</button>
      </div>

      {/* Chat */}
      <div className="chat-section" style={{ marginTop: 16 }}>
        <h3>Live Chat</h3>
        <div className="chat-messages" style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
          {chatMessages.map((m) => (
            <div key={m.id} className="chat-message">
              <span className="message-author" style={{ fontWeight: 600, marginRight: 6 }}>{m.displayName}</span>
              <span className="message-text">{m.message}</span>
            </div>
          ))}
        </div>
        <div className="chat-input" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input type="text" value={newChatMessage} onChange={(e) => setNewChatMessage(e.target.value)} placeholder="Type a message..." onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()} />
          <button onClick={sendChatMessage}>Send</button>
        </div>
      </div>

      {/* Reactions */}
      <div className="reactions-controls" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => sendReaction('❤️')}>❤️</button>
        <button onClick={() => sendReaction('🔥')}>🔥</button>
        <button onClick={() => sendReaction('👏')}>👏</button>
        <button onClick={() => sendReaction('👍')}>👍</button>
        <button onClick={() => sendReaction('✋')}>✋</button>
      </div>

      {error && (
        <div className="error" style={{ marginTop: 12, color: 'red' }}>{error}</div>
      )}
    </div>
  );
};

export default ScreenShare;


