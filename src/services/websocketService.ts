import { io, Socket } from 'socket.io-client';

export interface StreamParticipant {
  userId: string;
  opponentId?: string;
  challengeId: string;
  isHost: boolean;
  isViewer: boolean;
  streamId?: string;
  displayName: string;
  avatar?: string;
}

export interface StreamMessage {
  type: 'join' | 'leave' | 'offer' | 'answer' | 'ice-candidate' | 'chat' | 'viewer-joined' | 'viewer-left';
  data: any;
  from: string;
  to?: string;
  timestamp: number;
}

export interface ChallengeInfo {
  challengeId: string;
  title: string;
  description: string;
  hostId: string;
  opponentId?: string;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  viewers: number;
  startTime?: Date;
  endTime?: Date;
}

class WebSocketService {
  private socket: Socket | null = null;
  private streamParticipants: Map<string, StreamParticipant> = new Map();
  private challenges: Map<string, ChallengeInfo> = new Map();
  private onMessageCallbacks: ((message: StreamMessage) => void)[] = [];
  private onParticipantUpdateCallbacks: ((participants: StreamParticipant[]) => void)[] = [];
  private onChallengeUpdateCallbacks: ((challenges: ChallengeInfo[]) => void)[] = [];

  // WebSocket server URL (Socket.IO expects http(s) URL)
  private wsUrl = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

  private currentChallengeId: string | null = null;

  connect(userId: string, token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = this.wsUrl;
        this.socket = io(url, {
          auth: {
            userId,
            token
          },
          transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected:', this.socket?.id, 'as user', userId);
          // Notify backend to mark user online and broadcast friend status
          this.socket?.emit('user-connect', { userId });
          resolve();
        });

        this.socket.on('disconnect', (reason: string) => {
          console.log('WebSocket disconnected:', reason);
        });

        this.socket.on('connect_error', (err: any) => {
          console.error('WebSocket connect_error:', err?.message || err);
        });
        this.socket.on('error', (error: any) => {
          console.error('WebSocket error:', error);
          reject(error);
        });

        // --- Backend socket event mappings ---
        // 1) Acknowledgement on joining stream
        this.socket.on('stream-joined', (payload: { challengeId: string; viewerId: string; viewerCount: number; timestamp: number; }) => {
          // Emit a viewer-joined-like message for UI purposes
          this.handleStreamMessage({ type: 'viewer-joined', data: { userId: payload.viewerId }, from: payload.viewerId, timestamp: payload.timestamp });
        });

        // 2) Viewer join/leave notifications
        this.socket.on('viewer-joined', (payload: { challengeId: string; viewerId: string; viewerCount: number; timestamp: number; }) => {
          this.handleStreamMessage({ type: 'viewer-joined', data: { userId: payload.viewerId }, from: payload.viewerId, timestamp: payload.timestamp });
        });
        this.socket.on('viewer-left', (payload: { challengeId: string; viewerId: string; viewerCount: number; timestamp: number; }) => {
          this.handleStreamMessage({ type: 'viewer-left', data: { userId: payload.viewerId }, from: payload.viewerId, timestamp: payload.timestamp });
        });

        // 3) Chat messages
        this.socket.on('stream-chat', (chatPayload: { id: string; challengeId: string; userId: string; message: string; messageType: string; timestamp: number; }) => {
          this.handleStreamMessage({ type: 'chat', data: { message: chatPayload.message, challengeId: chatPayload.challengeId }, from: chatPayload.userId, timestamp: chatPayload.timestamp });
        });

        // 4) WebRTC signaling passthrough
        this.socket.on('stream-signal', (payload: { signal: any; from?: string }) => {
          const { signal, from } = payload || {};
          if (!signal) return;
          const ts = Date.now();
          if (signal.type === 'offer') {
            this.handleStreamMessage({ type: 'offer', data: signal, from: from || 'unknown', timestamp: ts });
          } else if (signal.type === 'answer') {
            this.handleStreamMessage({ type: 'answer', data: signal, from: from || 'unknown', timestamp: ts });
          } else if (signal.candidate) {
            this.handleStreamMessage({ type: 'ice-candidate', data: signal, from: from || 'unknown', timestamp: ts });
          }
        });

        this.socket.on('participants-update', (participants: StreamParticipant[]) => {
          this.streamParticipants.clear();
          participants.forEach(p => this.streamParticipants.set(p.userId, p));
          this.onParticipantUpdateCallbacks.forEach(callback => callback(participants));
        });

        this.socket.on('challenge-update', (challenges: ChallengeInfo[]) => {
          this.challenges.clear();
          challenges.forEach(c => this.challenges.set(c.challengeId, c));
          this.onChallengeUpdateCallbacks.forEach(callback => callback(challenges));
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join a challenge stream
  joinChallenge(challengeId: string, userId: string, opponentId?: string, isViewer: boolean = false): void {
    if (!this.socket) {
      console.error('WebSocket not connected');
      return;
    }
    this.currentChallengeId = challengeId;
    // Backend expects a single challengeId for join
    this.socket.emit('join-challenge-stream', challengeId);
  }

  // Leave a challenge stream
  leaveChallenge(challengeId: string, userId: string): void {
    if (!this.socket) return;
    this.socket.emit('leave-challenge-stream', challengeId);
    if (this.currentChallengeId === challengeId) this.currentChallengeId = null;
  }

  // Send WebRTC offer
  sendOffer(to: string, offer: RTCSessionDescriptionInit): void {
    if (!this.socket || !this.currentChallengeId) return;
    this.socket.emit('stream-signal', { challengeId: this.currentChallengeId, signal: offer });
  }

  // Send WebRTC answer
  sendAnswer(to: string, answer: RTCSessionDescriptionInit): void {
    if (!this.socket || !this.currentChallengeId) return;
    this.socket.emit('stream-signal', { challengeId: this.currentChallengeId, signal: answer });
  }

  // Send ICE candidate
  sendIceCandidate(to: string, candidate: RTCIceCandidateInit): void {
    if (!this.socket || !this.currentChallengeId) return;
    this.socket.emit('stream-signal', { challengeId: this.currentChallengeId, signal: candidate });
  }

  // Send chat message
  sendChatMessage(message: string, challengeId: string): void {
    if (!this.socket) return;
    this.socket.emit('send-stream-chat', { challengeId, message });
  }

  // Create a new challenge
  createChallenge(challengeData: Omit<ChallengeInfo, 'challengeId' | 'viewers'>): void {
    if (!this.socket) return;

    this.socket.emit('create-challenge', challengeData);
  }

  // Get current user ID (you'll need to implement this based on your auth system)
  private getCurrentUserId(): string {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user._id;
    }
    return 'unknown';
  }

  private sendMessage(_message: StreamMessage): void {
    // No-op: backend uses specific events; kept for backward compatibility
  }

  private handleStreamMessage(message: StreamMessage): void {
    console.log('Received stream message:', message);
    this.onMessageCallbacks.forEach(callback => callback(message));
  }

  // Event listeners
  onMessage(callback: (message: StreamMessage) => void): void {
    this.onMessageCallbacks.push(callback);
  }

  onParticipantUpdate(callback: (participants: StreamParticipant[]) => void): void {
    this.onParticipantUpdateCallbacks.push(callback);
  }

  onChallengeUpdate(callback: (challenges: ChallengeInfo[]) => void): void {
    this.onChallengeUpdateCallbacks.push(callback);
  }

  // Get current participants
  getParticipants(): StreamParticipant[] {
    return Array.from(this.streamParticipants.values());
  }

  // Get current challenges
  getChallenges(): ChallengeInfo[] {
    return Array.from(this.challenges.values());
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

const websocketService = new WebSocketService();
export default websocketService; 