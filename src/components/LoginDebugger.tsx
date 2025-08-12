import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/apiService';
import { WithdrawalApiService } from '../services/withdrawalApiService';

interface LoginTestResult {
  testName: string;
  success: boolean;
  message: string;
  response?: any;
  error?: any;
}

interface WithdrawTestResult {
  testName: string;
  success: boolean;
  message: string;
  response?: any;
  error?: any;
}

const LoginDebugger: React.FC = () => {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<LoginTestResult[]>([]);
  const [withdrawResults, setWithdrawResults] = useState<WithdrawTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [testCredentials, setTestCredentials] = useState({
    email: 'test@example.com',
    password: 'password123'
  });
  const [withdrawAmount, setWithdrawAmount] = useState('10.00');
  const [withdrawMethod, setWithdrawMethod] = useState('bank_transfer');

  const runLoginTests = async () => {
    setLoading(true);
    setTestResults([]);
    const results: LoginTestResult[] = [];

    console.log('🔍 LoginDebugger: Starting login tests...');

    // Test 1: Backend connectivity
    try {
      console.log('🔍 LoginDebugger: Testing backend connectivity...');
      const healthResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/v1'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
      });
      
      results.push({
        testName: 'Backend Connectivity',
        success: healthResponse.status !== 404,
        message: healthResponse.status !== 404 ? 'Backend is reachable' : `Backend error: ${healthResponse.status}`,
        response: { status: healthResponse.status }
      });
    } catch (error: any) {
      results.push({
        testName: 'Backend Connectivity',
        success: false,
        message: `Backend not reachable: ${error.message}`,
        error: error
      });
    }

    // Test 2: Login endpoint accessibility
    try {
      console.log('🔍 LoginDebugger: Testing login endpoint...');
      const loginResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/v1'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'invalid@test.com',
          password: 'wrongpassword'
        })
      });
      
      results.push({
        testName: 'Login Endpoint',
        success: loginResponse.status !== 404,
        message: loginResponse.status === 404 ? 'Login endpoint not found' : 'Login endpoint accessible',
        response: { status: loginResponse.status, statusText: loginResponse.statusText }
      });
    } catch (error: any) {
      results.push({
        testName: 'Login Endpoint',
        success: false,
        message: `Login endpoint error: ${error.message}`,
        error: error
      });
    }

    // Test 3: Test with invalid credentials
    try {
      console.log('🔍 LoginDebugger: Testing with invalid credentials...');
      const invalidResponse = await ApiService.login({
        email: 'invalid@test.com',
        password: 'wrongpassword'
      });
      
      results.push({
        testName: 'Invalid Credentials',
        success: false,
        message: 'Unexpected success with invalid credentials',
        response: invalidResponse
      });
    } catch (error: any) {
      const isExpectedError = error.response?.status === 401 || error.response?.status === 400;
      results.push({
        testName: 'Invalid Credentials',
        success: isExpectedError,
        message: isExpectedError ? 'Correctly rejected invalid credentials' : `Unexpected error: ${error.message}`,
        error: error.response?.data || error.message
      });
    }

    // Test 4: Test with test credentials
    try {
      console.log('🔍 LoginDebugger: Testing with test credentials...');
      const testResponse = await ApiService.login(testCredentials);
      
      results.push({
        testName: 'Test Credentials Login',
        success: true,
        message: 'Successfully logged in with test credentials',
        response: {
          hasUser: !!testResponse.user,
          hasToken: !!testResponse.token,
          tokenLength: testResponse.token?.length || 0
        }
      });

      // Store the successful login data
      if (testResponse.user && testResponse.token) {
        localStorage.setItem('user', JSON.stringify(testResponse.user));
        localStorage.setItem('token', testResponse.token);
        console.log('🔍 LoginDebugger: Stored test login data');
      }
    } catch (error: any) {
      results.push({
        testName: 'Test Credentials Login',
        success: false,
        message: `Login failed: ${error.response?.data?.message || error.message}`,
        error: error.response?.data || error.message
      });
    }

    // Test 5: Check stored authentication data
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    results.push({
      testName: 'Stored Auth Data',
      success: !!(storedToken && storedUser),
      message: storedToken && storedUser 
        ? `Auth data stored - Token: ${storedToken.substring(0, 20)}..., User: ${JSON.parse(storedUser).name || 'Unknown'}`
        : 'No authentication data stored',
      response: {
        hasToken: !!storedToken,
        hasUser: !!storedUser,
        tokenPreview: storedToken ? storedToken.substring(0, 20) + '...' : null,
        userInfo: storedUser ? JSON.parse(storedUser) : null
      }
    });

    setTestResults(results);
    setLoading(false);
    console.log('🔍 LoginDebugger: Login tests completed:', results);
  };

  const runWithdrawTests = async () => {
    setWithdrawLoading(true);
    setWithdrawResults([]);
    const results: WithdrawTestResult[] = [];

    console.log('💰 WithdrawDebugger: Starting withdraw tests...');

    const token = localStorage.getItem('token');
    if (!token) {
      results.push({
        testName: 'Authentication Check',
        success: false,
        message: 'No authentication token found. Please login first.',
        error: 'Missing token'
      });
      setWithdrawResults(results);
      setWithdrawLoading(false);
      return;
    }

    // Test 1: Check withdrawal request endpoint accessibility
    try {
      console.log('💰 WithdrawDebugger: Testing withdrawal request endpoint...');
      const withdrawalResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/v1'}/wallet/withdrawal/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: '6892eb2b6682fe4b88afa730',
          amount: 10,
          currency: 'USD'
        })
      });
      
      results.push({
        testName: 'Withdrawal Request Endpoint',
        success: withdrawalResponse.status !== 404,
        message: withdrawalResponse.status === 404 ? 'Withdrawal request endpoint not found' : 'Withdrawal request endpoint accessible',
        response: { status: withdrawalResponse.status, statusText: withdrawalResponse.statusText }
      });
    } catch (error: any) {
      results.push({
        testName: 'Withdrawal Request Endpoint',
        success: false,
        message: `Withdrawal request endpoint error: ${error.message}`,
        error: error
      });
    }

    // Test 2: Check withdrawal requests list endpoint (admin)
    try {
      console.log('💰 WithdrawDebugger: Testing withdrawal requests list endpoint...');
      const requestsResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/v1'}/wallet/withdrawal/requests`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      results.push({
        testName: 'Withdrawal Requests List Endpoint',
        success: requestsResponse.status !== 404,
        message: requestsResponse.status === 404 ? 'Withdrawal requests list endpoint not found' : 'Withdrawal requests list endpoint accessible',
        response: { status: requestsResponse.status, statusText: requestsResponse.statusText }
      });
    } catch (error: any) {
      results.push({
        testName: 'Withdrawal Requests List Endpoint',
        success: false,
        message: `Withdrawal requests list endpoint error: ${error.message}`,
        error: error
      });
    }

    // Test 3: Check balance endpoint
    try {
      console.log('💰 WithdrawDebugger: Testing balance endpoint...');
      const balanceResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/v1'}/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      results.push({
        testName: 'Balance Endpoint',
        success: balanceResponse.status !== 404,
        message: balanceResponse.status === 404 ? 'Balance endpoint not found' : 'Balance endpoint accessible',
        response: { status: balanceResponse.status, statusText: balanceResponse.statusText }
      });
    } catch (error: any) {
      results.push({
        testName: 'Balance Endpoint',
        success: false,
        message: `Balance endpoint error: ${error.message}`,
        error: error
      });
    }

    // Test 4: Test actual withdrawal request
    try {
      console.log('💰 WithdrawDebugger: Testing withdrawal request...');
      const withdrawalRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/v1'}/wallet/withdrawal/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: '6892eb2b6682fe4b88afa730',
          amount: parseFloat(withdrawAmount),
          currency: 'USD'
        })
      });
      
      const withdrawalData = await withdrawalRequest.json();
      
      results.push({
        testName: 'Withdrawal Request',
        success: withdrawalRequest.ok,
        message: withdrawalRequest.ok ? 'Withdrawal request successful' : `Withdrawal request failed: ${withdrawalData.message || 'Unknown error'}`,
        response: withdrawalData
      });
    } catch (error: any) {
      results.push({
        testName: 'Withdrawal Request',
        success: false,
        message: `Withdrawal request error: ${error.message}`,
        error: error
      });
    }

    // Test 5: Test balance retrieval
    try {
      console.log('💰 WithdrawDebugger: Testing balance retrieval...');
      const balanceRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/v1'}/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (balanceRequest.ok) {
        const balanceData = await balanceRequest.json();
        results.push({
          testName: 'Balance Retrieval',
          success: true,
          message: `Current balance: $${balanceData.balance || 'Unknown'}`,
          response: balanceData
        });
      } else {
        results.push({
          testName: 'Balance Retrieval',
          success: false,
          message: `Failed to retrieve balance: ${balanceRequest.status}`,
          response: { status: balanceRequest.status }
        });
      }
    } catch (error: any) {
      results.push({
        testName: 'Balance Retrieval',
        success: false,
        message: `Balance retrieval error: ${error.message}`,
        error: error
      });
    }

    // Test 6: Test withdrawal requests list retrieval
    try {
      console.log('💰 WithdrawDebugger: Testing withdrawal requests list...');
      const requestsRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/v1'}/wallet/withdrawal/requests`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (requestsRequest.ok) {
        const requestsData = await requestsRequest.json();
        results.push({
          testName: 'Withdrawal Requests List',
          success: true,
          message: `Retrieved ${requestsData.requests?.length || 0} withdrawal requests`,
          response: requestsData
        });
      } else {
        results.push({
          testName: 'Withdrawal Requests List',
          success: false,
          message: `Failed to retrieve withdrawal requests: ${requestsRequest.status}`,
          response: { status: requestsRequest.status }
        });
      }
    } catch (error: any) {
      results.push({
        testName: 'Withdrawal Requests List',
        success: false,
        message: `Withdrawal requests list error: ${error.message}`,
        error: error
      });
    }

    setWithdrawResults(results);
    setWithdrawLoading(false);
    console.log('💰 WithdrawDebugger: Withdraw tests completed:', results);
  };

  const performWithdraw = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first to perform withdraw operations');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/v1'}/wallet/withdrawal/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: '6892eb2b6682fe4b88afa730',
          amount: parseFloat(withdrawAmount),
          currency: 'USD'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`Withdrawal request successful! Request ID: ${data.requestId || 'N/A'}`);
      } else {
        alert(`Withdrawal request failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Withdrawal request error: ${error.message}`);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setTestResults([]);
    setWithdrawResults([]);
    alert('Authentication data cleared!');
  };

  const setManualTestData = () => {
    const testUser = {
      _id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com'
    };
    const testToken = 'test-token-' + Date.now();
    
    localStorage.setItem('user', JSON.stringify(testUser));
    localStorage.setItem('token', testToken);
    
    setTestResults([{
      testName: 'Manual Test Data',
      success: true,
      message: 'Test authentication data set manually',
      response: { user: testUser, token: testToken.substring(0, 20) + '...' }
    }]);
    
    alert('Test authentication data set!');
  };

  const getCategoryColor = (success: boolean) => {
    return success ? '#10b981' : '#ef4444';
  };

  return (
    <div className="login-debugger-container">
      <div className="login-debugger-header">
        <h2>🔐 Login & Withdraw Debugger</h2>
        <p className="login-debugger-description">
          Debug login and withdraw issues and test authentication flow. This tool helps identify
          problems with the login process, withdraw operations, backend connectivity, and token generation.
        </p>
      </div>

      {/* Test Credentials */}
      <div className="test-credentials-section">
        <h3>🧪 Test Credentials</h3>
        <div className="credentials-form">
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={testCredentials.email}
              onChange={(e) => setTestCredentials(prev => ({ ...prev, email: e.target.value }))}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={testCredentials.password}
              onChange={(e) => setTestCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Withdraw Settings */}
      <div className="withdraw-settings-section">
        <h3>💰 Withdraw Settings</h3>
        <div className="withdraw-form">
          <div className="form-group">
            <label>Amount ($):</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Method:</label>
            <select
              value={withdrawMethod}
              onChange={(e) => setWithdrawMethod(e.target.value)}
              className="form-input"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="paypal">PayPal</option>
              <option value="stripe">Stripe</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>⚡ Quick Actions</h3>
        <div className="action-buttons">
          <button 
            onClick={runLoginTests}
            disabled={loading}
            className="action-btn primary"
          >
            {loading ? 'Running Tests...' : 'Run Login Tests'}
          </button>
          
          <button 
            onClick={runWithdrawTests}
            disabled={withdrawLoading}
            className="action-btn primary"
          >
            {withdrawLoading ? 'Running Tests...' : 'Run Withdraw Tests'}
          </button>
          
          <button 
            onClick={performWithdraw}
            className="action-btn secondary"
          >
            Perform Withdraw
          </button>
          
          <button 
            onClick={setManualTestData}
            className="action-btn secondary"
          >
            Set Test Auth Data
          </button>
          
          <button 
            onClick={clearAuthData}
            className="action-btn danger"
          >
            Clear Auth Data
          </button>
          
          <button 
            onClick={() => navigate('/login')}
            className="action-btn secondary"
          >
            Go to Login Page
          </button>
          
          <button 
            onClick={() => navigate('/withdrawal-request')}
            className="action-btn secondary"
          >
            Go to Withdrawal Request
          </button>
        </div>
      </div>

      {/* Login Test Results */}
      {testResults.length > 0 && (
        <div className="test-results">
          <h3>🔬 Login Test Results</h3>
          <div className="results-grid">
            {testResults.map((result, index) => (
              <div key={index} className="test-result-item">
                <div className="test-header">
                  <span className="test-name">{result.testName}</span>
                  <span 
                    className="test-status"
                    style={{ color: getCategoryColor(result.success) }}
                  >
                    {result.success ? '✅ Success' : '❌ Failed'}
                  </span>
                </div>
                <div className="test-message">
                  {result.message}
                </div>
                {result.response && (
                  <div className="test-response">
                    <strong>Response:</strong>
                    <pre>{JSON.stringify(result.response, null, 2)}</pre>
                  </div>
                )}
                {result.error && (
                  <div className="test-error">
                    <strong>Error:</strong>
                    <pre>{JSON.stringify(result.error, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdraw Test Results */}
      {withdrawResults.length > 0 && (
        <div className="test-results">
          <h3>💰 Withdraw Test Results</h3>
          <div className="results-grid">
            {withdrawResults.map((result, index) => (
              <div key={index} className="test-result-item">
                <div className="test-header">
                  <span className="test-name">{result.testName}</span>
                  <span 
                    className="test-status"
                    style={{ color: getCategoryColor(result.success) }}
                  >
                    {result.success ? '✅ Success' : '❌ Failed'}
                  </span>
                </div>
                <div className="test-message">
                  {result.message}
                </div>
                {result.response && (
                  <div className="test-response">
                    <strong>Response:</strong>
                    <pre>{JSON.stringify(result.response, null, 2)}</pre>
                  </div>
                )}
                {result.error && (
                  <div className="test-error">
                    <strong>Error:</strong>
                    <pre>{JSON.stringify(result.error, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Issues */}
      <div className="common-issues">
        <h3>🚨 Common Issues</h3>
        <div className="issues-list">
          <div className="issue-item">
            <h4>1. Backend Not Running</h4>
            <p>Ensure your backend server is running on port 5000</p>
            <code>npm start</code> (in backend directory)
          </div>
          
          <div className="issue-item">
            <h4>2. Wrong API URL</h4>
            <p>Check your .env file has correct backend URL</p>
            <code>REACT_APP_API_BASE_URL=http://localhost:5000/v1</code>
          </div>
          
          <div className="issue-item">
            <h4>3. Invalid Credentials</h4>
            <p>Make sure you're using valid email/password</p>
            <p>Try registering a new account first</p>
          </div>
          
          <div className="issue-item">
            <h4>4. CORS Issues</h4>
            <p>Backend might not allow requests from frontend</p>
            <p>Check backend CORS configuration</p>
          </div>
          
          <div className="issue-item">
            <h4>5. Network Issues</h4>
            <p>Check if you can access backend directly</p>
            <p>Try: <code>http://localhost:5000/v1/auth/login</code></p>
          </div>

          <div className="issue-item">
            <h4>6. Withdrawal Request Endpoint Issues</h4>
            <p>Ensure withdrawal request endpoint is implemented in backend</p>
            <p>Check: <code>http://localhost:5000/v1/wallet/withdrawal/request</code></p>
          </div>

          <div className="issue-item">
            <h4>7. Withdrawal Requests List Issues</h4>
            <p>Ensure withdrawal requests list endpoint is accessible</p>
            <p>Check: <code>http://localhost:5000/v1/wallet/withdrawal/requests</code></p>
          </div>

          <div className="issue-item">
            <h4>8. Insufficient Balance</h4>
            <p>Make sure user has sufficient balance for payout request</p>
            <p>Check balance endpoint: <code>http://localhost:5000/v1/balance</code></p>
          </div>
        </div>
      </div>

      {/* Manual Testing */}
      <div className="manual-testing">
        <h3>🔧 Manual Testing</h3>
        <div className="manual-tests">
          <div className="manual-test">
            <h4>Test 1: Direct Backend Access</h4>
            <p>Open browser console and run:</p>
            <code>
              {`fetch('http://localhost:5000/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
}).then(r => r.json()).then(console.log).catch(console.error)`}
            </code>
          </div>
          
          <div className="manual-test">
            <h4>Test 2: Login API Call</h4>
            <p>Test login directly:</p>
            <code>
              {`fetch('http://localhost:5000/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
}).then(r => r.json()).then(console.log)`}
            </code>
          </div>
          
          <div className="manual-test">
            <h4>Test 3: Check Stored Data</h4>
            <p>Check localStorage:</p>
            <code>
              {`console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));`}
            </code>
          </div>

          <div className="manual-test">
            <h4>Test 4: Withdrawal Request API Call</h4>
            <p>Test withdrawal request directly:</p>
            <code>
              {`fetch('http://localhost:5000/v1/wallet/withdrawal/request', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({
    userId: '6892eb2b6682fe4b88afa730',
    amount: 10,
    currency: 'USD'
  })
}).then(r => r.json()).then(console.log)`}
            </code>
          </div>

          <div className="manual-test">
            <h4>Test 5: Check Balance</h4>
            <p>Check user balance:</p>
            <code>
              {`fetch('http://localhost:5000/v1/balance', {
  method: 'GET',
  headers: { 
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
}).then(r => r.json()).then(console.log)`}
            </code>
          </div>

          <div className="manual-test">
            <h4>Test 6: Withdrawal Requests List (Admin)</h4>
            <p>Check withdrawal requests list:</p>
            <code>
              {`fetch('http://localhost:5000/v1/wallet/withdrawal/requests', {
  method: 'GET',
  headers: { 
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
}).then(r => r.json()).then(console.log)`}
            </code>
          </div>

          <div className="manual-test">
            <h4>Test 7: Process Withdrawal Request (Admin)</h4>
            <p>Process a withdrawal request (approve/reject):</p>
            <code>
              {`fetch('http://localhost:5000/v1/wallet/withdrawal/process', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({
    requestId: '689334c1d4f1123304b30d8d',
    action: 'approve',
    reason: 'Approved by admin'
  })
}).then(r => r.json()).then(console.log)`}
            </code>
          </div>

          <div className="manual-test">
            <h4>Test 8: Get User Withdrawal Requests</h4>
            <p>Get withdrawal requests for a specific user:</p>
            <code>
              {`fetch('http://localhost:5000/v1/wallet/withdrawal/requests/6892eb2b6682fe4b88afa730', {
  method: 'GET',
  headers: { 
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
}).then(r => r.json()).then(console.log)`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginDebugger; 