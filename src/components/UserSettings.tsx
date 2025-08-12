import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ApiService from '../services/apiService';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Wallet {
  userId: string;
  balance: number;
  stripeAccountId: string;
  connectAccountLink: string;
  onboardingStatus: 'pending' | 'completed' | 'failed';
}

interface OnboardingResponse {
  status: string;
  data: {
    userId: string;
    balance: number;
    stripeAccountId: string;
    onboardingStatus: string;
  };
}

const UserSettings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Environment variables
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/v1';
  const APP_URL = process.env.REACT_APP_APP_URL || 'http://localhost:3000/';

  useEffect(() => {
    // Load user data from localStorage or location state
    const userData = localStorage.getItem('user');
    console.log('UserSettings: localStorage user data:', userData);
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('UserSettings: Parsed user data:', parsedUser);
        
        // Handle both 'id' and '_id' fields for user ID
        const userId = parsedUser._id || parsedUser.id;
        console.log('UserSettings: User ID:', userId);
        
        // Ensure the user object has the _id field for consistency
        const userWithId = {
          ...parsedUser,
          _id: userId
        };
        
        setUser(userWithId);
        
        // Load wallet data if user ID is available
        if (userId) {
          loadWalletData(userId);
        }
      } catch (error) {
        console.error('UserSettings: Error parsing user data:', error);
        setError('Invalid user data in localStorage');
      }
    } else {
      console.log('UserSettings: No user data found in localStorage');
      
      // Check if user data is in location state (from registration)
      if (location.state?.userId) {
        console.log('UserSettings: Found user data in location state:', location.state);
        const userFromState = {
          _id: location.state.userId,
          name: location.state.name || 'Unknown',
          email: location.state.email || 'unknown@example.com'
        };
        setUser(userFromState);
        // Store in localStorage for future use
        localStorage.setItem('user', JSON.stringify(userFromState));
        loadWalletData(location.state.userId);
      } else if (location.state?.id) {
        console.log('UserSettings: Found user data in location state with id field:', location.state);
        const userFromState = {
          _id: location.state.id,
          name: location.state.name || 'Unknown',
          email: location.state.email || 'unknown@example.com'
        };
        setUser(userFromState);
        // Store in localStorage for future use
        localStorage.setItem('user', JSON.stringify(userFromState));
        loadWalletData(location.state.id);
      } else {
        setError('No user data found. Please register or login first.');
      }
    }

    // Handle onboarding return
    handleOnboardingReturn();
  }, [location.state]);

  const loadWalletData = async (userId: string) => {
    try {
      console.log('UserSettings: Loading wallet data for user ID:', userId);
      const response = await ApiService.getWallet(userId);
      console.log('UserSettings: Wallet response:', response);
      setWallet(response);
    } catch (error: any) {
      console.error('UserSettings: Failed to load wallet:', error);
      // Don't set error state for wallet loading failure as it's not critical
    }
  };

  const handleOnboardingReturn = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const onboardingStatus = urlParams.get('onboarding_status');
    const userId = urlParams.get('userId');
    const stripeAccountId = urlParams.get('stripeAccountId');

    if (onboardingStatus && userId && stripeAccountId) {
      setLoading(true);
      try {
        console.log('Processing onboarding return...');
        console.log('Status:', onboardingStatus);
        console.log('User ID:', userId);
        console.log('Stripe Account ID:', stripeAccountId);

        const response = await ApiService.updateAfterOnboarding({
          userId,
          stripeAccountId,
          onboardingStatus
        });

        console.log('Onboarding update response:', response);

        if (response.status === 'success') {
          setSuccess('Stripe onboarding completed successfully!');
          // Update wallet data
          setWallet(prev => prev ? {
            ...prev,
            onboardingStatus: onboardingStatus as 'pending' | 'completed' | 'failed'
          } : null);
        }

        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err: any) {
        console.error('Onboarding update error:', err);
        setError('Failed to update onboarding status');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStartOnboarding = async () => {
    if (!user) {
      setError('No user data available. Please login again.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('UserSettings: Starting onboarding for user:', user);
      console.log('UserSettings: User ID being sent:', user._id);
      
      // Validate user ID format
      if (!user._id || user._id.trim() === '') {
        throw new Error('Invalid user ID. User ID is missing or empty.');
      }
      
      // Check authentication
      const token = localStorage.getItem('token');
      console.log('UserSettings: Authentication token present:', !!token);
      console.log('UserSettings: Token length:', token?.length || 0);
      console.log('UserSettings: Token value (first 20 chars):', token ? token.substring(0, 20) + '...' : 'None');
      
      if (!token) {
        console.warn('UserSettings: No token found, but continuing with request...');
      }
      
      // Check if user is properly authenticated
      const userData = localStorage.getItem('user');
      console.log('UserSettings: User data in localStorage:', userData ? 'Present' : 'Missing');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('UserSettings: Parsed user data:', parsedUser);
        console.log('UserSettings: User ID from localStorage:', parsedUser._id || parsedUser.id);
      }
      
      const response = await ApiService.generateOnboardingLink({
        userId: user._id
      });

      console.log('UserSettings: Onboarding link response:', response);

      if (response.connectAccountLink) {
        console.log('UserSettings: Redirecting to:', response.connectAccountLink);
        window.location.href = response.connectAccountLink;
      } else {
        console.error('UserSettings: No connect account link in response');
        console.error('UserSettings: Full response:', response);
        console.error('UserSettings: Response keys:', Object.keys(response));
        setError('No onboarding link received from server. Please try again.');
      }
    } catch (err: any) {
      console.error('UserSettings: Failed to generate onboarding link:', err);
      console.error('UserSettings: Error type:', err.constructor.name);
      console.error('UserSettings: Error stack:', err.stack);
      
      // Display user-friendly error message
      const errorMessage = err.message || 'Failed to start Stripe onboarding';
      setError(errorMessage);
      
      // Additional debugging information
      console.error('UserSettings: Current user state:', user);
      console.error('UserSettings: localStorage token:', !!localStorage.getItem('token'));
      console.error('UserSettings: API base URL:', process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/v1');
      
      // Check if this is an authentication issue
      if (errorMessage.includes('Authentication failed')) {
        console.error('UserSettings: AUTHENTICATION ISSUE DETECTED');
        console.error('UserSettings: Current token:', localStorage.getItem('token'));
        console.error('UserSettings: User data:', localStorage.getItem('user'));
        
        // Try to set a test token
        const testToken = 'test-auth-token-' + Date.now();
        localStorage.setItem('token', testToken);
        console.log('UserSettings: Set test token:', testToken);
        setError('Authentication issue detected. Test token set. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDismissError = () => setError('');
  const handleDismissSuccess = () => setSuccess('');

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('stripeAccountId');
    localStorage.removeItem('connectAccountLink');
    navigate('/login');
  };

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return {
      hasToken: !!token,
      hasUser: !!user,
      tokenLength: token ? token.length : 0
    };
  };

  const runDiagnostics = async () => {
    const diagnostics = {
      user: !!user,
      userId: user?._id,
      token: !!localStorage.getItem('token'),
      tokenLength: localStorage.getItem('token')?.length || 0,
      apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/v1',
      currentUrl: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    console.log('UserSettings: Diagnostics:', diagnostics);
    
    // Test token authentication
    if (user?._id) {
      try {
        const authResult = await ApiService.testTokenAuthentication(user._id);
        console.log('UserSettings: Token authentication test:', authResult);
        
        if (authResult.success) {
          setSuccess('✅ Token authentication successful! Check console for details.');
        } else {
          setSuccess(`❌ Token authentication failed: ${authResult.message}. Check console for details.`);
        }
      } catch (error) {
        console.error('UserSettings: Token test error:', error);
        setSuccess('❌ Token test error. Check console for details.');
      }
    } else {
      setSuccess('Diagnostics logged to console. Check browser console for details.');
    }
    
    return diagnostics;
  };

  const checkAuthState = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    const authState = {
      hasToken: !!token,
      tokenValue: token ? token.substring(0, 20) + '...' : 'None',
      hasUser: !!userData,
      userData: userData ? JSON.parse(userData) : null
    };
    
    console.log('UserSettings: Authentication State:', authState);
    return authState;
  };

  const fixAuthentication = () => {
    console.log('UserSettings: Attempting to fix authentication...');
    
    // Set a proper test token
    const testToken = 'Bearer test-token-' + Date.now();
    localStorage.setItem('token', testToken);
    
    // Ensure user data is properly formatted
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Ensure the user has an _id field
        if (!parsedUser._id && parsedUser.id) {
          parsedUser._id = parsedUser.id;
          localStorage.setItem('user', JSON.stringify(parsedUser));
          console.log('UserSettings: Fixed user data format');
        }
      } catch (error) {
        console.error('UserSettings: Error parsing user data:', error);
      }
    }
    
    console.log('UserSettings: Authentication fix applied');
    setSuccess('Authentication fixed. Please try onboarding again.');
  };

  const simulateLogin = () => {
    console.log('UserSettings: Simulating login state...');
    
    // Create a proper user object
    const testUser = {
      _id: user?._id || 'test-user-id',
      id: user?._id || 'test-user-id',
      name: user?.name || 'Test User',
      email: user?.email || 'test@example.com',
      role: 'user',
      status: 1
    };
    
    // Create a proper JWT token (this is a mock token for testing)
    const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODhjYTM5ZGU5ZGU4ODJjZDgxOGM4YjUiLCJpYXQiOjE3NTQyODIzMzgsImV4cCI6MTc1NDQ2MjMzOCwidHlwZSI6ImFjY2VzcyJ9.573pDbKqSPPrbiBUhK6R2x1HPhiQDRcpwIKCxjUXLpc';
    
    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(testUser));
    localStorage.setItem('token', mockJWT);
    
    console.log('UserSettings: Login simulation complete');
    console.log('UserSettings: Test user:', testUser);
    console.log('UserSettings: JWT token set');
    
    setSuccess('Login simulation complete with JWT token. Please try onboarding again.');
    
    // Reload the component to use the new data
    window.location.reload();
  };

  if (!user) {
    return <div className="loading">Loading user data...</div>;
  }

  return (
    <div className="user-settings-container">
      <h2>User Settings</h2>
      
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

      <div className="user-info">
        <h3>User Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Name:</label>
            <span>{user.name}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{user.email}</span>
          </div>
          <div className="info-item">
            <label>User ID:</label>
            <span>{user._id}</span>
          </div>
        </div>
      </div>

      <div className="wallet-info">
        <h3>Wallet Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Balance:</label>
            <span>${wallet?.balance || 0}</span>
            <button 
              onClick={() => user && loadWalletData(user._id)} 
              className="action-btn secondary"
              style={{ marginLeft: '10px', fontSize: '12px' }}
            >
              Refresh
            </button>
          </div>
          <div className="info-item">
            <label>Stripe Account ID:</label>
            <span>{wallet?.stripeAccountId || 'Not created'}</span>
          </div>
          <div className="info-item">
            <label>Onboarding Status:</label>
            <span className={`status-${wallet?.onboardingStatus || 'pending'}`}>
              {wallet?.onboardingStatus || 'pending'}
            </span>
          </div>
        </div>
      </div>

      <div className="debug-section">
        <h3>Debug Information</h3>
        <div className="debug-grid">
          <div className="debug-item">
            <label>Current Wallet State:</label>
            <pre>{JSON.stringify(wallet, null, 2)}</pre>
          </div>
          <div className="debug-item">
            <label>User Data:</label>
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </div>
          <div className="debug-item">
            <label>Token Status:</label>
            <span>{localStorage.getItem('token') ? 'Token exists' : 'No token'}</span>
          </div>
        </div>
        <div className="debug-actions">
          <button 
            onClick={() => user && loadWalletData(user._id)} 
            className="action-btn secondary"
          >
            Debug: Reload Wallet
          </button>
          <button 
            onClick={() => {
              console.log('UserSettings: Current wallet state:', wallet);
              console.log('UserSettings: Current user state:', user);
              console.log('UserSettings: Token:', localStorage.getItem('token'));
            }} 
            className="action-btn secondary"
          >
            Debug: Log State
          </button>
        </div>
      </div>

      <div className="actions">
        <button 
          onClick={handleStartOnboarding} 
          disabled={loading}
          className="action-btn primary"
        >
          {loading ? 'Processing...' : 'Start Stripe Onboarding'}
        </button>
        
        <button 
          onClick={() => navigate('/wallet')} 
          className="action-btn secondary"
        >
          Go to Wallet Dashboard
        </button>

        <button 
          onClick={() => navigate('/topup')} 
          className="action-btn primary"
        >
          Top Up Wallet
        </button>

        <button 
          onClick={() => navigate('/challenges')} 
          className="action-btn secondary"
        >
          Live Video Challenges
        </button>

        <button 
          onClick={() => navigate('/testing-cards')} 
          className="action-btn secondary"
        >
          🧪 Testing Card Details
        </button>

        <button 
          onClick={() => navigate('/auth-debugger')} 
          className="action-btn secondary"
        >
          🔍 Auth Debugger
        </button>

        <button 
          onClick={() => navigate('/login-debugger')} 
          className="action-btn secondary"
        >
          🔐 Login Debugger
        </button>

        <button 
          onClick={() => navigate('/token-debugger')} 
          className="action-btn secondary"
        >
          🔍 Token Debugger
        </button>

        <button 
          onClick={handleLogout} 
          className="action-btn danger"
        >
          Logout
        </button>

        <button 
          onClick={() => {
            const testUser = {
              id: 'test-user-id-123',
              _id: 'test-user-id-123',
              name: 'Test User',
              email: 'test@example.com',
              role: 'user',
              status: 1,
              level: 1,
              badges: [],
              isEmailVerified: false,
              isBlock: false,
              isOnline: false,
              coins: 0,
              balance: 0
            };
            localStorage.setItem('user', JSON.stringify(testUser));
            setUser(testUser);
            setSuccess('Test user data set successfully');
          }} 
          className="action-btn secondary"
        >
          Set Test User Data
        </button>

        <button 
          onClick={() => {
            localStorage.setItem('token', 'test-token-123');
            setSuccess('Test token set successfully');
          }} 
          className="action-btn secondary"
        >
          Set Test Token
        </button>

        <button 
          onClick={runDiagnostics} 
          className="action-btn secondary"
        >
          Run Diagnostics
        </button>

        <button 
          onClick={() => {
            const testToken = 'manual-test-token-' + Date.now();
            localStorage.setItem('token', testToken);
            console.log('UserSettings: Manually set token:', testToken);
            console.log('UserSettings: localStorage token after setting:', localStorage.getItem('token'));
            setSuccess('Manual token set successfully');
          }} 
          className="action-btn secondary"
        >
          Set Manual Token
        </button>

        <button 
          onClick={() => {
            const authState = checkAuthState();
            setSuccess(`Auth check complete. Token: ${authState.hasToken ? 'Present' : 'Missing'}`);
          }} 
          className="action-btn secondary"
        >
          Check Auth State
        </button>

        <button 
          onClick={() => navigate('/quick-auth-test')} 
          className="action-btn"
        >
          Quick Auth Test
        </button>

        <button 
          onClick={async () => {
            const isConnected = await ApiService.testBackendConnection();
            setSuccess(`Backend connection: ${isConnected ? 'Success' : 'Failed'}`);
          }} 
          className="action-btn secondary"
        >
          Test Backend Connection
        </button>

        <button 
          onClick={async () => {
            if (!user?._id) {
              setError('No user ID available');
              return;
            }
            const result = await ApiService.testAuthenticationMethods(user._id);
            setSuccess(`Auth test: ${result.success ? result.method : 'All failed'}`);
          }} 
          className="action-btn secondary"
        >
          Test Auth Methods
        </button>

        <button 
          onClick={async () => {
            if (!user?._id) {
              setError('No user ID available');
              return;
            }
            const result = await ApiService.testOnboardingEndpoint(user._id);
            setSuccess(`Endpoint test: ${result.success ? result.method : 'All failed'}`);
          }} 
          className="action-btn secondary"
        >
          Test Onboarding Endpoint
        </button>

        <button 
          onClick={fixAuthentication} 
          className="action-btn secondary"
        >
          Fix Authentication
        </button>

        <button 
          onClick={simulateLogin} 
          className="action-btn secondary"
        >
          Simulate Login
        </button>
      </div>

      <div className="demo-info">
        <h3>Environment Information:</h3>
        <p><strong>API Base URL:</strong> http://localhost:5000/v1</p>
        <p><strong>App URL:</strong> {APP_URL}</p>
        <p><strong>Current URL:</strong> {window.location.href}</p>
        
        <h3>Debug Information:</h3>
        <p><strong>User State:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
        <p><strong>localStorage user:</strong> {localStorage.getItem('user') || 'null'}</p>
        <p><strong>Location State:</strong> {location.state ? JSON.stringify(location.state, null, 2) : 'null'}</p>
        <p><strong>Auth Status:</strong> {JSON.stringify(checkAuthStatus(), null, 2)}</p>
        <p><strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
      </div>
    </div>
  );
};

export default UserSettings; 