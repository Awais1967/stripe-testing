import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/apiService';

const JoinChallenge: React.FC = () => {
  const navigate = useNavigate();
  const [challengeId, setChallengeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const getUser = () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  };

  const handleJoinAsParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = getUser();
    if (!user) {
      setError('Please login to continue');
      return;
    }
    const userId = user._id || user.id;
    if (!userId) {
      setError('Logged-in user is missing id');
      return;
    }
    if (!challengeId.trim()) {
      setError('Enter a challenge ID or code');
      return;
    }
    try {
      setLoading(true);
      const resp = await ApiService.joinChallenge(challengeId.trim(), userId);
      setSuccess(resp?.message || 'Joined challenge successfully');
      // Navigate to live stream view for participants
      navigate(`/stream/${challengeId.trim()}/${userId}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to join challenge';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinAsViewer = (e: React.MouseEvent) => {
    e.preventDefault();
    setError('');
    const user = getUser();
    if (!user) {
      setError('Please login to continue');
      return;
    }
    const userId = user._id || user.id || 'viewer';
    if (!challengeId.trim()) {
      setError('Enter a challenge ID or code');
      return;
    }
    // Navigate to live stream view for viewers
    navigate(`/stream/${challengeId.trim()}/${userId}`);
  };

  return (
    <div className="join-challenge-container">
      <h2>Join a Challenge</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleJoinAsParticipant} className="join-form">
        <label htmlFor="challengeId">Challenge ID / Code</label>
        <input
          id="challengeId"
          type="text"
          placeholder="Enter challenge ID or short code"
          value={challengeId}
          onChange={(e) => setChallengeId(e.target.value)}
        />

        <div className="actions">
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Joining...' : 'Join as Participant'}
          </button>
          <button type="button" className="btn secondary" onClick={handleJoinAsViewer}>
            Watch as Viewer
          </button>
        </div>
      </form>
    </div>
  );
};

export default JoinChallenge;




