import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/apiService';
import { WithdrawalApiService } from '../services/withdrawalApiService';

interface WithdrawalRequest {
  id?: string;
  _id?: string;
  requestId?: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  stripeTransferId?: string;
  reason?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

const WithdrawalRequest: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('usd');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserAndWallet();
    loadWithdrawalRequests();
  }, []);

  const loadUserAndWallet = async () => {
    try {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      console.log('User data from localStorage:', userData);
      console.log('Token from localStorage:', token ? 'Present' : 'Missing');
      
      if (!userData) {
        setError('No user data found. Please login again.');
        return;
      }

      const user = JSON.parse(userData);
      console.log('Loaded user data:', user);
      
      // Check if user has _id field, try different possible field names
      const userId = user._id || user.id || user.userId;
      if (!userId) {
        console.error('User data missing ID field. Available fields:', Object.keys(user));
        setError('Invalid user data. Please login again.');
        return;
      }
      
      // Create a normalized user object
      const normalizedUser = {
        ...user,
        _id: userId
      };

      setUser(normalizedUser);

      // Get wallet by userId from wallet table
      console.log('Loading wallet by userId from wallet table:', userId);
      try {
        const walletResponse = await ApiService.getWalletDirect(userId);
        console.log('Wallet response received:', walletResponse);
        console.log('Wallet balance:', walletResponse?.balance);
        
        // Handle different possible wallet response structures
        let normalizedWallet = walletResponse;
        if (walletResponse && typeof walletResponse === 'object') {
          // Check if balance is in a nested structure
          if (walletResponse.data && walletResponse.data.balance !== undefined) {
            normalizedWallet = walletResponse.data;
            console.log('Using nested data structure for wallet');
          } else if (walletResponse.wallet && walletResponse.wallet.balance !== undefined) {
            normalizedWallet = walletResponse.wallet;
            console.log('Using wallet.wallet structure for wallet');
          }
        }
        
        console.log('Normalized wallet:', normalizedWallet);
        setWallet(normalizedWallet);
      } catch (err: any) {
        console.error('Failed to load wallet:', err);
        setError('Failed to load wallet data');
      }
    } catch (err: any) {
      console.error('Failed to load user data:', err);
      setError('Failed to load user data');
    }
  };

  const loadWithdrawalRequests = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      
      // Check if user has _id field, try different possible field names
      const userId = user._id || user.id || user.userId;
      if (!userId) {
        console.error('User data missing ID field for withdrawal requests. Available fields:', Object.keys(user));
        return;
      }
      
      console.log('Loading withdrawal requests for user ID:', userId);
      const requests = await WithdrawalApiService.getWithdrawalRequests(userId);
      setWithdrawalRequests(requests);
    } catch (err: any) {
      console.error('Failed to load withdrawal requests:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !wallet) {
      setError('User or wallet data not available');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (numAmount > wallet.balance) {
      setError('Insufficient balance for withdrawal');
      return;
    }

    if (numAmount < 10) {
      setError('Minimum withdrawal amount is $10');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await WithdrawalApiService.createWithdrawalRequest({
        userId: user._id,
        amount: numAmount.toString()
      });

      setSuccess('Withdrawal request submitted successfully! It will be reviewed by an administrator.');
      setAmount('');
      
      // Reload withdrawal requests
      await loadWithdrawalRequests();
    } catch (err: any) {
      console.error('Withdrawal request failed:', err);
      setError(err.message || 'Failed to submit withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'approved': return 'blue';
      case 'completed': return 'green';
      case 'rejected': return 'red';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDismissError = () => setError('');
  const handleDismissSuccess = () => setSuccess('');

  const handleApproveRequest = async (requestId: string) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Approving withdrawal request:', requestId);
      
      // Check if requestId is valid
      if (!requestId || requestId === 'undefined') {
        throw new Error('Invalid request ID. Please try again.');
      }
      
      const response = await WithdrawalApiService.processWithdrawalRequest({
        requestId,
        action: 'approve'
      });

      console.log('Approval response:', response);
      setSuccess('Withdrawal request approved successfully!');
      
      // Reload withdrawal requests to update the list
      await loadWithdrawalRequests();
    } catch (err: any) {
      console.error('Failed to approve withdrawal request:', err);
      setError(err.message || 'Failed to approve withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string, reason: string = '') => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Rejecting withdrawal request:', requestId, 'Reason:', reason);
      const response = await WithdrawalApiService.processWithdrawalRequest({
        requestId,
        action: 'reject',
        reason: reason || 'Rejected by administrator'
      });

      console.log('Rejection response:', response);
      setSuccess('Withdrawal request rejected successfully!');
      
      // Reload withdrawal requests to update the list
      await loadWithdrawalRequests();
    } catch (err: any) {
      console.error('Failed to reject withdrawal request:', err);
      setError(err.message || 'Failed to reject withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="loading">Loading user data...</div>;
  }

  return (
    <div className="withdrawal-request-container">
      <h2>Request Withdrawal</h2>
      
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

      <div className="wallet-overview">
        <div className="balance-card">
          <h3>Available Balance</h3>
          <div className="balance-amount">${wallet?.balance?.toFixed(2) || '0.00'}</div>
          {process.env.NODE_ENV === 'development' && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              Debug: Wallet object = {JSON.stringify(wallet, null, 2)}
            </div>
          )}
        </div>
      </div>

      <div className="withdrawal-form-section">
        <h3>Request Withdrawal</h3>
        <form onSubmit={handleSubmit} className="withdrawal-form">
          <div className="form-group">
            <label htmlFor="amount">Amount (USD)</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="10"
              max={wallet?.balance || 0}
              step="0.01"
              required
              placeholder="Enter amount to withdraw"
            />
            <small>Minimum: $10 | Maximum: ${wallet?.balance?.toFixed(2) || '0.00'}</small>
          </div>

          <div className="form-group">
            <label htmlFor="currency">Currency</label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              required
            >
              <option value="usd">USD</option>
              <option value="eur">EUR</option>
              <option value="gbp">GBP</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="action-btn primary"
            disabled={loading || !amount || parseFloat(amount) <= 0}
          >
            {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
          </button>
        </form>
      </div>

      <div className="withdrawal-history-section">
        <h3>Withdrawal History</h3>
        {withdrawalRequests.length === 0 ? (
          <p className="no-data">No withdrawal requests found.</p>
        ) : (
          <div className="withdrawal-requests-list">
            {withdrawalRequests.map((request) => {
              console.log('Withdrawal request object:', request);
              console.log('Request ID:', request.id);
              console.log('Request _id:', request._id);
              console.log('All request keys:', Object.keys(request));
              
              // Try different possible ID fields
              const requestId = request.id || request._id || request.requestId;
              console.log('Using request ID:', requestId);
              
              return (
              <div key={requestId || request.id} className="withdrawal-request-item">
                <div className="request-header">
                  <div className="request-amount">
                    ${(request.amount || 0).toFixed(2)} {request.currency?.toUpperCase() || 'USD'}
                  </div>
                  <div className={`request-status status-${request.status || 'pending'}`}>
                    {request.status ? (request.status.charAt(0).toUpperCase() + request.status.slice(1)) : 'Pending'}
                  </div>
                </div>
                <div className="request-details">
                  <div className="request-date">
                    Requested: {formatDate(request.createdAt)}
                  </div>
                  {request.updatedAt !== request.createdAt && (
                    <div className="request-date">
                      Updated: {formatDate(request.updatedAt)}
                    </div>
                  )}
                  {request.reason && (
                    <div className="request-reason">
                      Reason: {request.reason}
                    </div>
                  )}
                </div>
                
                {/* Action buttons for pending requests */}
                {(request.status === 'pending' || !request.status) && requestId && (
                  <div className="request-actions" style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid #eee'
                  }}>
                    <button
                      onClick={() => handleApproveRequest(requestId)}
                      className="action-btn approve-btn"
                      disabled={loading}
                      style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      {loading ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleRejectRequest(requestId)}
                      className="action-btn reject-btn"
                      disabled={loading}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      {loading ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawalRequest;
