import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/apiService';
import websocketService, { ChallengeInfo } from '../services/websocketService';

interface CreateChallengeForm {
  title: string;
  description: string;
  opponentId?: string;
}

const Challenges: React.FC = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<ChallengeInfo[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateChallengeForm>({
    title: '',
    description: '',
    opponentId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');



  useEffect(() => {
    loadChallenges();
    setupWebSocket();
  }, []);

  const setupWebSocket = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      const uid = user._id || user.id;
      if (!uid) {
        console.warn('No user id found on stored user object');
      }
      websocketService.connect(uid || 'unknown');
      websocketService.onChallengeUpdate(handleChallengeUpdate);
    }
  };

  const handleChallengeUpdate = (updatedChallenges: ChallengeInfo[]) => {
    setChallenges(updatedChallenges);
  };

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError('No user data found');
        return;
      }
      const user = JSON.parse(userData);
      const userId = user._id || user.id;
      if (!userId) {
        setError('Logged-in user is missing id');
        return;
      }
      const pending = await ApiService.getChallenges(userId);
      // pending is an array of items with keys challenge_id, opponent_id, opponent_name, etc.
      const mapped: ChallengeInfo[] = (pending || []).map((p: any) => ({
        challengeId: p.challenge_id,
        title: p.opponent_name ? `Match vs ${p.opponent_name}` : 'Pending Challenge',
        description: p.match_type_name || 'Pending challenge awaiting opponent',
        hostId: userId,
        opponentId: p.opponent_id || undefined,
        status: (p.status || 'waiting') as any,
        viewers: 0,
        startTime: undefined,
        endTime: undefined,
      }));
      setChallenges(mapped);
    } catch (err: any) {
      console.error('Failed to load challenges:', err);
      setError('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      setError('Please enter a challenge title');
      return;
    }

    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError('No user data found');
        return;
      }

      const user = JSON.parse(userData);
      
      const challengeData = {
        title: createForm.title,
        description: createForm.description,
        hostId: user._id,
        opponentId: createForm.opponentId || undefined,
        status: 'waiting' as const
      };

      websocketService.createChallenge(challengeData);
      
      setSuccess('Challenge created successfully!');
      setShowCreateForm(false);
      setCreateForm({ title: '', description: '', opponentId: '' });
      
      // Reload challenges after a short delay
      setTimeout(() => {
        loadChallenges();
      }, 1000);

    } catch (err: any) {
      console.error('Failed to create challenge:', err);
      setError('Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challenge: ChallengeInfo, asViewer: boolean = false) => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      setError('No user data found');
      return;
    }

    const user = JSON.parse(userData);
    const userId = user._id || user.id;
    if (!userId) {
      setError('Logged-in user is missing id');
      return;
    }

    if (asViewer) {
      // Join as viewer
      navigate(`/stream/${challenge.challengeId}/${userId}`);
    } else {
      try {
        setLoading(true);
        setError('');
        const resp = await ApiService.joinChallenge(challenge.challengeId, userId);
        setSuccess(resp?.message || 'Joined challenge successfully');
        // Navigate to stream after successful join
        navigate(`/stream/${challenge.challengeId}/${userId}/${challenge.hostId}`);
      } catch (err: any) {
        console.error('Join challenge failed:', err);
        const msg = err?.response?.data?.message || err.message || 'Failed to join challenge';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDismissError = () => setError('');
  const handleDismissSuccess = () => setSuccess('');

  const getCurrentUser = () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  };

  const currentUser = getCurrentUser();

  return (
    <div className="challenges-container">
      <div className="challenges-header">
        <h2>Live Video Challenges</h2>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="create-challenge-btn"
        >
          Create New Challenge
        </button>
        <button
          onClick={() => navigate('/join-challenge')}
          className="join-challenge-btn"
        >
          Join by Code
        </button>
      </div>

      {error && (
        <div className="error-message dismissible">
          {error}
          <button onClick={handleDismissError} className="dismiss-btn">×</button>
        </div>
      )}

      {success && (
        <div className="success-message dismissible">
          {success}
          <button onClick={handleDismissSuccess} className="dismiss-btn">×</button>
        </div>
      )}

      {showCreateForm && (
        <div className="create-challenge-modal">
          <div className="modal-content">
            <h3>Create New Challenge</h3>
            <form onSubmit={handleCreateChallenge}>
              <div className="form-group">
                <label htmlFor="title">Challenge Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={createForm.title}
                  onChange={handleInputChange}
                  placeholder="Enter challenge title"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={createForm.description}
                  onChange={handleInputChange}
                  placeholder="Enter challenge description"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="opponentId">Opponent ID (Optional)</label>
                <input
                  type="text"
                  id="opponentId"
                  name="opponentId"
                  value={createForm.opponentId}
                  onChange={handleInputChange}
                  placeholder="Enter opponent user ID"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="submit-btn"
                >
                  {loading ? 'Creating...' : 'Create Challenge'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="challenges-list">
        {loading ? (
          <div className="loading">Loading challenges...</div>
        ) : challenges.length === 0 ? (
          <div className="no-challenges">
            <p>No active challenges found.</p>
            <p>Create a new challenge to get started!</p>
          </div>
        ) : (
          challenges.map(challenge => (
            <div key={challenge.challengeId} className="challenge-card">
              <div className="challenge-info">
                <h3>{challenge.title}</h3>
                <p>{challenge.description}</p>
                <div className="challenge-meta">
                  <span className="status-badge">{challenge.status}</span>
                  <span className="viewers-count">{challenge.viewers} viewers</span>
                  {challenge.startTime && (
                    <span className="start-time">
                      Started: {new Date(challenge.startTime).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="challenge-participants">
                <div className="participant">
                  <span className="participant-label">Host:</span>
                  <span className="participant-name">{challenge.hostId}</span>
                </div>
                {challenge.opponentId && (
                  <div className="participant">
                    <span className="participant-label">Opponent:</span>
                    <span className="participant-name">{challenge.opponentId}</span>
                  </div>
                )}
              </div>

              <div className="challenge-actions">
                {currentUser && challenge.hostId === currentUser._id ? (
                  <button 
                    onClick={() => handleJoinChallenge(challenge, false)}
                    className="join-btn host"
                  >
                    Start Challenge
                  </button>
                ) : challenge.opponentId && currentUser && challenge.opponentId === currentUser._id ? (
                  <button 
                    onClick={() => handleJoinChallenge(challenge, false)}
                    className="join-btn opponent"
                  >
                    Join Challenge
                  </button>
                ) : (
                  <button 
                    onClick={() => handleJoinChallenge(challenge, true)}
                    className="join-btn viewer"
                  >
                    Watch Live
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="demo-info">
        <h3>How to Use:</h3>
        <ul>
          <li><strong>Create Challenge:</strong> Start a new live video challenge</li>
          <li><strong>Join as Participant:</strong> If you're the host or opponent, join with video/audio</li>
          <li><strong>Watch Live:</strong> Join as a viewer to watch the challenge</li>
          <li><strong>URL Format:</strong> /stream/&#123;challengeId&#125;/&#123;userId&#125;/&#123;opponentId?&#125;</li>
        </ul>
        <p><strong>API Base URL:</strong> http://localhost:5000/v1</p>
      </div>
    </div>
  );
};

export default Challenges; 