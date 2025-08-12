# Stripe Testing App with Live Video Streaming

A comprehensive React application for testing Stripe Connect integration and live video streaming with WebSocket support.

## 🚀 Features

### Core Features
- **User Registration & Authentication**: Complete user registration flow with Stripe integration
- **Stripe Connect Onboarding**: Simulated Stripe Connect account creation and onboarding
- **Wallet Management**: Deposit, withdraw, and balance tracking
- **Live Video Streaming**: Real-time video streaming with WebRTC and WebSocket support

### Live Video Streaming Features
- **Multi-Participant Support**: Host, opponent, and viewer roles
- **WebRTC Integration**: Peer-to-peer video streaming
- **Real-time Chat**: Live chat during streams
- **Participant Management**: View all participants in real-time
- **Challenge System**: Create and join video challenges
- **Viewer Mode**: Watch live streams without participating

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, React Router DOM
- **Styling**: CSS3 with Glassmorphism design
- **WebSocket**: Socket.io-client for real-time communication
- **WebRTC**: Peer-to-peer video streaming
- **HTTP Client**: Axios for API calls
- **Mock API**: Simulated backend for development

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stripe-testing
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   # Create .env file
   REACT_APP_API_BASE_URL=http://localhost:5000/v1
   REACT_APP_APP_URL=http://localhost:3000
   REACT_APP_WS_URL=ws://localhost:3001
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

## 🎯 Application Flow

### 1. User Registration
- Navigate to `/register`
- Fill in user details (name, email, password)
- System creates user and Stripe Connect account
- Redirects to user settings for onboarding

### 2. Stripe Onboarding
- Complete Stripe Connect account setup
- Handle return URL with onboarding status
- Update wallet with completed onboarding

### 3. Live Video Streaming
- **Create Challenge**: Navigate to `/challenges` and create new video challenges
- **Join as Participant**: Host or opponent joins with video/audio
- **Join as Viewer**: Watch live streams without participating
- **Real-time Communication**: Chat and participant management

## 🔗 API Endpoints

### Authentication
- `POST /auth/register` - User registration with Stripe account creation

### Wallet Management
- `GET /wallet/:userId` - Get wallet information
- `POST /wallet/:userId/deposit` - Deposit funds
- `POST /wallet/:userId/withdraw` - Withdraw funds
- `POST /wallet/onboarding/initiate` - Generate onboarding link
- `POST /wallet/onboarding/update` - Update after onboarding

### Challenges
- `GET /challenges` - Get all challenges
- `POST /challenges` - Create new challenge
- `GET /challenges/:challengeId` - Get specific challenge

## 🎥 Live Video Streaming

### URL Structure
```
/stream/:challengeId/:userId          # Join as viewer
/stream/:challengeId/:userId/:opponentId  # Join as participant
```

### WebSocket Events
- `join-challenge` - Join a challenge stream
- `leave-challenge` - Leave a challenge stream
- `stream-message` - WebRTC signaling and chat messages
- `participants-update` - Real-time participant updates
- `challenge-update` - Challenge status updates

### WebRTC Features
- **Peer-to-Peer**: Direct video/audio streaming between participants
- **ICE Candidates**: NAT traversal for different network configurations
- **Offer/Answer**: WebRTC session establishment
- **Media Controls**: Mute/unmute audio, enable/disable video

## 🎨 UI Components

### Core Components
- `UserRegistration` - User registration form
- `UserSettings` - User profile and onboarding management
- `StripeOnboarding` - Stripe Connect onboarding flow
- `WalletDashboard` - Wallet management interface

### Live Streaming Components
- `LiveVideoStream` - Main video streaming interface
- `Challenges` - Challenge creation and management
- `WebSocketService` - Real-time communication service

## 🔧 Configuration

### Environment Variables
```env
REACT_APP_API_BASE_URL=http://localhost:5000/v1
REACT_APP_APP_URL=http://localhost:3000
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### WebRTC Configuration
```javascript
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};
```

## 🧪 Testing Scenarios

### Stripe Integration
1. **Registration Flow**: Complete user registration
2. **Onboarding**: Simulate Stripe Connect onboarding
3. **Return Handling**: Process onboarding completion
4. **Wallet Updates**: Update wallet after successful onboarding

### Live Video Streaming
1. **Challenge Creation**: Create new video challenges
2. **Participant Joining**: Join as host, opponent, or viewer
3. **WebRTC Connection**: Establish peer-to-peer connections
4. **Real-time Chat**: Send and receive chat messages
5. **Media Controls**: Test mute/unmute and video toggle
6. **Participant Management**: View and manage participants

## 📱 Responsive Design

The application features a responsive design that works on:
- Desktop computers
- Tablets
- Mobile devices

Key responsive features:
- Adaptive video grid layout
- Mobile-friendly controls
- Touch-optimized interfaces

## 🔒 Security Considerations

### Frontend Security
- Environment variable protection
- Input validation and sanitization
- Secure WebSocket connections
- HTTPS enforcement for production

### WebRTC Security
- STUN/TURN server configuration
- ICE candidate filtering
- Media stream encryption
- Participant authentication

## 🚀 Deployment

### Development
```bash
npm start
```

### Production Build
```bash
npm run build
```

### Environment Setup
1. Configure environment variables
2. Set up WebSocket server
3. Configure STUN/TURN servers
4. Set up Stripe webhook endpoints

## 📚 Backend Integration

### Required Backend Endpoints
```javascript
// Authentication
POST /auth/register
POST /auth/login

// Wallet Management
GET /wallet/:userId
POST /wallet/:userId/deposit
POST /wallet/:userId/withdraw
POST /wallet/onboarding/initiate
POST /wallet/onboarding/update

// Challenges
GET /challenges
POST /challenges
GET /challenges/:challengeId
PUT /challenges/:challengeId
```

### WebSocket Server Requirements
```javascript
// Socket.io server setup
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

// Handle challenge rooms
io.on('connection', (socket) => {
  socket.on('join-challenge', (data) => {
    socket.join(data.challengeId);
    // Handle participant management
  });
  
  socket.on('stream-message', (message) => {
    socket.to(message.challengeId).emit('stream-message', message);
  });
});
```

## 🎯 Use Cases

### 1. Fitness Challenges
- Live workout competitions
- Real-time performance tracking
- Viewer engagement during challenges

### 2. Gaming Tournaments
- Live gaming streams
- Tournament management
- Spectator mode

### 3. Educational Sessions
- Live tutoring sessions
- Interactive learning
- Student engagement

### 4. Business Meetings
- Video conferencing
- Screen sharing
- Meeting recording

## 🔧 Troubleshooting

### Common Issues

1. **WebRTC Connection Failed**
   - Check STUN/TURN server configuration
   - Verify network connectivity
   - Check browser permissions

2. **WebSocket Connection Issues**
   - Verify WebSocket server URL
   - Check CORS configuration
   - Ensure server is running

3. **Video/Audio Not Working**
   - Check browser permissions
   - Verify device availability
   - Test with different browsers

4. **Stripe Integration Errors**
   - Verify API keys
   - Check webhook endpoints
   - Validate account creation

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the documentation

---

**Note**: This is a development/testing application. For production use, ensure proper security measures, error handling, and scalability considerations are implemented.
