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

  // WebSocket server URL
  private wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';

  connect(userId: string, token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.wsUrl, {
          auth: {
            userId,
            token
          },
          transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected:', this.socket?.id);
          resolve();
        });

        this.socket.on('disconnect', (reason: string) => {
          console.log('WebSocket disconnected:', reason);
        });

        this.socket.on('error', (error: any) => {
          console.error('WebSocket error:', error);
          reject(error);
        });

        // Handle incoming messages
        this.socket.on('stream-message', (message: StreamMessage) => {
          this.handleStreamMessage(message);
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

    this.socket.emit('join-challenge', {
      challengeId,
      userId,
      opponentId,
      isViewer
    });
  }

  // Leave a challenge stream
  leaveChallenge(challengeId: string, userId: string): void {
    if (!this.socket) return;

    this.socket.emit('leave-challenge', {
      challengeId,
      userId
    });
  }

  // Send WebRTC offer
  sendOffer(to: string, offer: RTCSessionDescriptionInit): void {
    this.sendMessage({
      type: 'offer',
      data: offer,
      from: this.getCurrentUserId(),
      to,
      timestamp: Date.now()
    });
  }

  // Send WebRTC answer
  sendAnswer(to: string, answer: RTCSessionDescriptionInit): void {
    this.sendMessage({
      type: 'answer',
      data: answer,
      from: this.getCurrentUserId(),
      to,
      timestamp: Date.now()
    });
  }

  // Send ICE candidate
  sendIceCandidate(to: string, candidate: RTCIceCandidateInit): void {
    this.sendMessage({
      type: 'ice-candidate',
      data: candidate,
      from: this.getCurrentUserId(),
      to,
      timestamp: Date.now()
    });
  }

  // Send chat message
  sendChatMessage(message: string, challengeId: string): void {
    this.sendMessage({
      type: 'chat',
      data: { message, challengeId },
      from: this.getCurrentUserId(),
      timestamp: Date.now()
    });
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

  private sendMessage(message: StreamMessage): void {
    if (!this.socket) return;
    this.socket.emit('stream-message', message);
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