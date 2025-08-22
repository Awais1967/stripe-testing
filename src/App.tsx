import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import UserRegistration from './components/UserRegistration';
import UserLogin from './components/UserLogin';
import UserSettings from './components/UserSettings';
import StripeOnboarding from './components/StripeOnboarding';
import WalletDashboard from './components/WalletDashboard';
import TopUp from './components/TopUp';
import Challenges from './components/Challenges';
import LiveVideoStream from './components/LiveVideoStream';
import TestingCardDetails from './components/TestingCardDetails';
import AuthDebuggerComponent from './components/AuthDebugger';
import LoginDebugger from './components/LoginDebugger';
import TokenDebugger from './components/TokenDebugger';
import QuickAuthTest from './components/QuickAuthTest';
import SimpleAuthTest from './components/SimpleAuthTest';
import BackendTest from './components/BackendTest';
import ResponseDebugger from './components/ResponseDebugger';
import WithdrawalRequest from './components/WithdrawalRequest';
import WithdrawalApproval from './components/WithdrawalApproval';
import FriendRequestWebSocketTester from './components/FriendRequestWebSocketTester';
import JoinChallenge from './components/JoinChallenge';
import ScreenShare from './components/ScreenShare';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Stripe Testing App</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/register" element={<UserRegistration />} />
            <Route path="/login" element={<UserLogin />} />
            <Route path="/user-settings" element={<UserSettings />} />
            <Route path="/stripe-onboarding" element={<StripeOnboarding />} />
            <Route path="/wallet" element={<WalletDashboard />} />
            <Route path="/topup" element={<TopUp />} />
            <Route path="/testing-cards" element={<TestingCardDetails />} />
            <Route path="/auth-debugger" element={<AuthDebuggerComponent />} />
            <Route path="/login-debugger" element={<LoginDebugger />} />
            <Route path="/token-debugger" element={<TokenDebugger />} />
            <Route path="/quick-auth-test" element={<QuickAuthTest />} />
            <Route path="/simple-auth-test" element={<SimpleAuthTest />} />
            <Route path="/backend-test" element={<BackendTest />} />
            <Route path="/response-debugger" element={<ResponseDebugger />} />
            <Route path="/withdrawal-request" element={<WithdrawalRequest />} />
            <Route path="/withdrawal-approval" element={<WithdrawalApproval />} />
            <Route path="/websocket-tester" element={<FriendRequestWebSocketTester />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/join-challenge" element={<JoinChallenge />} />
            <Route path="/stream/:challengeId/:userId" element={<LiveVideoStream />} />
            <Route path="/stream/:challengeId/:userId/:opponentId" element={<LiveVideoStream />} />
            <Route path="/screen-share/:challengeId" element={<ScreenShare />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
