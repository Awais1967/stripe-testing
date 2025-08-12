import React, { useState, useEffect } from 'react';
import ApiService from '../services/apiService';

interface TransactionResponse {
  success?: boolean;
  status?: string;
  newBalance?: number;
  balance?: number;
  message?: string;
  data?: {
    newBalance?: number;
    balance?: number;
  };
}

interface Wallet {
  userId: string;
  balance: number;
  stripeAccountId: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  timestamp: Date;
  description: string;
}

const WalletDashboard: React.FC = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState<string>('');
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');



  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      console.log('WalletDashboard: Starting to load wallet data...');
      
      const userData = localStorage.getItem('user');
      console.log('WalletDashboard: Raw user data from localStorage:', userData);
      
      if (!userData) {
        setError('No user data found');
        return;
      }

      const user = JSON.parse(userData);
      console.log('WalletDashboard: Parsed user data:', user);
      console.log('WalletDashboard: User ID from localStorage:', user._id || user.id);
      
      // Ensure user has _id field
      if (!user._id && user.id) {
        user._id = user.id;
        console.log('WalletDashboard: Fixed user ID format');
      }
      
      if (!user._id) {
        setError('No user ID found');
        return;
      }
      
      console.log('WalletDashboard: About to call ApiService.getWallet with user ID:', user._id);
      
      const response = await ApiService.getWallet(user._id);
      console.log('WalletDashboard: API response:', response);
      
      setWallet(response);
      console.log('WalletDashboard: Wallet state updated:', response);
    } catch (err: any) {
      console.error('WalletDashboard: Failed to load wallet:', err);
      console.error('WalletDashboard: Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      setError(`Failed to load wallet data: ${err.message}`);
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !wallet) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError('No user data found');
        return;
      }

      const user = JSON.parse(userData);
      
      // Ensure user has _id field
      if (!user._id && user.id) {
        user._id = user.id;
      }
      
      if (!user._id) {
        setError('No user ID found');
        return;
      }
      
      console.log(`Making ${transactionType} request for user:`, user._id);
      console.log('Transaction data:', { userId: user._id, amount: numAmount });

      let response: TransactionResponse;
      if (transactionType === 'deposit') {
        response = await ApiService.deposit({ userId: user._id, amount: numAmount });
      } else {
        response = await ApiService.withdraw({ userId: user._id, amount: numAmount });
      }

      console.log('Transaction response:', response);
      console.log('Transaction response type:', typeof response);
      console.log('Transaction response keys:', Object.keys(response));

      // Handle different response formats
      if (response.success || response.status === 'success') {
        const message = response.message || 'Transaction completed successfully';
        const newBalance = response.newBalance || response.balance || (wallet ? wallet.balance + numAmount : numAmount);
        
        setSuccess(message);
        setAmount('');
        
        // Update wallet balance
        setWallet(prev => prev ? {
          ...prev,
          balance: newBalance
        } : null);

        // Add transaction to history
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          type: transactionType,
          amount: numAmount,
          timestamp: new Date(),
          description: message
        };

        setTransactions(prev => [newTransaction, ...prev]);
        
        // Refresh wallet data to ensure we have the latest balance
        setTimeout(() => {
          loadWalletData();
        }, 1000);
      } else {
        setError('Transaction failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Transaction error:', err);
      setError(err.response?.data?.message || `Failed to ${transactionType}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissError = () => setError('');
  const handleDismissSuccess = () => setSuccess('');

  if (!wallet) {
    return <div className="loading">Loading wallet data...</div>;
  }

  return (
    <div className="wallet-dashboard">
      <h2>Wallet Dashboard</h2>
      
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
          <h3>Current Balance</h3>
          <div className="balance-amount">${wallet.balance.toFixed(2)}</div>
          <button 
            onClick={loadWalletData} 
            className="action-btn secondary"
            style={{ marginTop: '10px' }}
          >
            Refresh Balance
          </button>
        </div>
        
        <div className="wallet-info">
          <div className="info-item">
            <label>User ID:</label>
            <span>{wallet.userId}</span>
          </div>
          <div className="info-item">
            <label>Stripe Account:</label>
            <span>{wallet.stripeAccountId}</span>
          </div>
        </div>
      </div>

      <div className="transaction-section">
        <h3>Make Transaction</h3>
        <form onSubmit={handleTransaction} className="transaction-form">
          <div className="form-group">
            <label>Transaction Type:</label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value as 'deposit' | 'withdraw')}
              className="transaction-type-select"
            >
              <option value="deposit">Deposit</option>
              <option value="withdraw">Withdraw</option>
            </select>
          </div>

          <div className="form-group">
            <label>Amount ($):</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Processing...' : `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}`}
          </button>
        </form>
      </div>

      <div className="transaction-history">
        <h3>Transaction History</h3>
        {transactions.length === 0 ? (
          <p className="no-transactions">No transactions yet</p>
        ) : (
          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                <div className="transaction-info">
                  <span className="transaction-type">{transaction.type}</span>
                  <span className="transaction-amount">${transaction.amount.toFixed(2)}</span>
                </div>
                <div className="transaction-details">
                  <span className="transaction-description">{transaction.description}</span>
                  <span className="transaction-time">
                    {transaction.timestamp.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="demo-info">
        <h3>Environment Information:</h3>
        <p><strong>API Base URL:</strong> http://localhost:5000/v1</p>
        <p><strong>Wallet ID:</strong> {wallet.userId}</p>
        <p><strong>Stripe Account ID:</strong> {wallet.stripeAccountId}</p>
      </div>

      <div className="debug-section">
        <h3>Debug Information</h3>
        <button onClick={loadWalletData} className="action-btn secondary">
          Debug: Reload Wallet Data
        </button>
        <button onClick={() => {
          const userData = localStorage.getItem('user');
          console.log('Debug: Current localStorage user data:', userData);
          if (userData) {
            const user = JSON.parse(userData);
            console.log('Debug: Parsed user data:', user);
            console.log('Debug: User ID:', user._id || user.id);
          }
        }} className="action-btn secondary">
          Debug: Check User Data
        </button>
        <button onClick={() => {
          const token = localStorage.getItem('token');
          console.log('Debug: Current token:', token);
        }} className="action-btn secondary">
          Debug: Check Token
        </button>
      </div>
    </div>
  );
};

export default WalletDashboard; 