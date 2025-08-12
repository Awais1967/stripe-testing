import React, { useState } from 'react';

const QuickAuthTest: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, success: boolean, message: string, data?: any) => {
    setResults(prev => [...prev, { test, success, message, data, timestamp: new Date().toISOString() }]);
  };

  const runQuickTest = async () => {
    setLoading(true);
    setResults([]);

    // Test 1: Check localStorage
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    addResult(
      'localStorage Check',
      !!(token && user),
      token && user ? 'Token and user found' : 'Missing token or user data',
      { hasToken: !!token, hasUser: !!user, tokenLength: token?.length || 0 }
    );

    // Test 2: Check token format
    if (token) {
      const parts = token.split('.');
      const isValidFormat = parts.length === 3;
      addResult(
        'Token Format',
        isValidFormat,
        isValidFormat ? 'Valid JWT format' : 'Invalid JWT format - should have 3 parts',
        { parts: parts.length, tokenPreview: token.substring(0, 50) + '...' }
      );
    }

    // Test 3: Test backend connectivity
    try {
      const response = await fetch('http://localhost:5000/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
      });
      
      addResult(
        'Backend Health',
        response.status !== 404,
        response.status !== 404 ? 'Backend is reachable' : `Backend error: ${response.status}`,
        { status: response.status }
      );
    } catch (error: any) {
      addResult(
        'Backend Health',
        false,
        `Backend not reachable: ${error.message}`,
        { error: error.message }
      );
    }

    // Test 4: Test registration endpoint
    try {
      const registerResponse = await fetch('http://localhost:5000/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: 'Test User',
          email: 'test@example.com', 
          password: 'password123' 
        })
      });
      
      const registerData = await registerResponse.json();
      addResult(
        'Registration Endpoint',
        registerResponse.ok,
        registerResponse.ok ? 'Registration successful' : `Registration failed: ${registerData.message || registerResponse.status}`,
        { status: registerResponse.status, hasToken: !!registerData.token }
      );
    } catch (error: any) {
      addResult(
        'Registration Endpoint',
        false,
        `Registration endpoint error: ${error.message}`,
        { error: error.message }
      );
    }

    // Test 5: Test login endpoint
    try {
      const loginResponse = await fetch('http://localhost:5000/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
      });
      
      const loginData = await loginResponse.json();
      addResult(
        'Login Endpoint',
        loginResponse.ok,
        loginResponse.ok ? 'Login endpoint working' : `Login failed: ${loginData.message || loginResponse.status}`,
        { status: loginResponse.status, hasToken: !!loginData.token }
      );
    } catch (error: any) {
      addResult(
        'Login Endpoint',
        false,
        `Login endpoint error: ${error.message}`,
        { error: error.message }
      );
    }

    // Test 6: Test wallet endpoint with current token
    if (token) {
      try {
        const userData = user ? JSON.parse(user) : null;
        const userId = userData?._id || 'test-user-id';
        
        const walletResponse = await fetch(`http://localhost:5000/v1/wallet/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        const walletData = await walletResponse.json();
        addResult(
          'Wallet Endpoint (with token)',
          walletResponse.ok,
          walletResponse.ok ? 'Wallet endpoint working with token' : `Wallet failed: ${walletData.message || walletResponse.status}`,
          { status: walletResponse.status, endpoint: `/wallet/${userId}` }
        );
      } catch (error: any) {
        addResult(
          'Wallet Endpoint (with token)',
          false,
          `Wallet endpoint error: ${error.message}`,
          { error: error.message }
        );
      }
    }

    // Test 7: Test wallet endpoint without token
    try {
      const walletResponse = await fetch('http://localhost:5000/v1/wallet/test-user-id', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      addResult(
        'Wallet Endpoint (no token)',
        walletResponse.status === 401,
        walletResponse.status === 401 ? 'Correctly rejected without token' : `Unexpected response: ${walletResponse.status}`,
        { status: walletResponse.status }
      );
    } catch (error: any) {
      addResult(
        'Wallet Endpoint (no token)',
        false,
        `Wallet endpoint error: ${error.message}`,
        { error: error.message }
      );
    }

    setLoading(false);
  };

  const clearResults = () => setResults([]);

  const manualLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'test@example.com', 
          password: 'password123' 
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        alert('Login successful! Token stored.');
      } else {
        alert(`Login failed: ${data.message || response.status}`);
      }
    } catch (error: any) {
      alert(`Login error: ${error.message}`);
    }
  };

  const getStatusColor = (success: boolean) => success ? '#10b981' : '#ef4444';

  return (
    <div className="debugger-container">
      <h2>🔍 Quick Authentication Test</h2>
      
      <div className="debug-section">
        <div className="button-grid">
          <button onClick={runQuickTest} className="action-btn" disabled={loading}>
            {loading ? 'Running Tests...' : 'Run Quick Test'}
          </button>
          <button onClick={manualLogin} className="action-btn">
            Manual Login
          </button>
          <button onClick={clearResults} className="action-btn secondary">
            Clear Results
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="debug-section">
          <h3>Test Results</h3>
          <div className="results-list">
            {results.map((result, index) => (
              <div key={index} className="result-item" style={{ borderLeft: `4px solid ${getStatusColor(result.success)}` }}>
                <div className="result-header">
                  <strong>{result.test}</strong>
                  <span className="result-status">
                    {result.success ? '✅ PASS' : '❌ FAIL'}
                  </span>
                </div>
                <div className="result-message">{result.message}</div>
                {result.data && (
                  <div className="result-data">
                    <pre>{JSON.stringify(result.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="debug-section">
        <h3>Quick Fixes</h3>
        <div className="fix-suggestions">
          <div className="fix-item">
            <strong>If "localStorage Check" fails:</strong>
            <p>Login again to get fresh token and user data</p>
          </div>
          <div className="fix-item">
            <strong>If "Token Format" fails:</strong>
            <p>Clear localStorage and login again - token should be a proper JWT</p>
          </div>
          <div className="fix-item">
            <strong>If "Backend Health" fails:</strong>
            <p>Start your backend server on port 5000</p>
          </div>
          <div className="fix-item">
            <strong>If "Login Endpoint" fails:</strong>
            <p>Check backend authentication configuration</p>
          </div>
          <div className="fix-item">
            <strong>If "Wallet Endpoint (with token)" fails:</strong>
            <p>Backend JWT secret might not match - check backend configuration</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickAuthTest; 