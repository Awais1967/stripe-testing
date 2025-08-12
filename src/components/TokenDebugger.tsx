import React, { useState, useEffect } from 'react';

const TokenDebugger: React.FC = () => {
  const [tokenInfo, setTokenInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<any>(null);

  const checkToken = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    setTokenInfo({
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? token.substring(0, 50) + '...' : null,
      hasUser: !!user,
      userInfo: user ? JSON.parse(user) : null,
      timestamp: new Date().toISOString()
    });
  };

  const testTokenRequest = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found! Please login first.');
      return;
    }

    try {
      console.log('🔍 TokenDebugger: Testing token request...');
      console.log('🔍 TokenDebugger: Token:', token.substring(0, 50) + '...');
      
      const response = await fetch('http://localhost:5000/v1/wallet/test', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('🔍 TokenDebugger: Response status:', response.status);
      console.log('🔍 TokenDebugger: Response data:', data);
      
      setTestResults({
        status: response.status,
        data: data,
        success: response.status === 200
      });
      
      alert(`Request status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      console.error('🔍 TokenDebugger: Request failed:', error);
      setTestResults({
        status: 'ERROR',
        data: error.message,
        success: false
      });
      alert(`Request failed: ${error.message}`);
    }
  };

  const testWithAxios = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found! Please login first.');
      return;
    }

    try {
      console.log('🔍 TokenDebugger: Testing with axios...');
      
      const axios = require('axios');
      const response = await axios.get('http://localhost:5000/v1/wallet/test', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 TokenDebugger: Axios response:', response.data);
      setTestResults({
        status: response.status,
        data: response.data,
        success: true
      });
      
      alert(`Axios request successful!\nStatus: ${response.status}\nData: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error: any) {
      console.error('🔍 TokenDebugger: Axios request failed:', error.response?.data || error.message);
      setTestResults({
        status: error.response?.status || 'ERROR',
        data: error.response?.data || error.message,
        success: false
      });
      alert(`Axios request failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const testWalletEndpoint = async () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      alert('No token or user found! Please login first.');
      return;
    }

    try {
      const userData = JSON.parse(user);
      console.log('🔍 TokenDebugger: Testing wallet endpoint for user:', userData._id);
      
      const response = await fetch(`http://localhost:5000/v1/wallet/${userData._id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('🔍 TokenDebugger: Wallet response status:', response.status);
      console.log('🔍 TokenDebugger: Wallet response data:', data);
      
      setTestResults({
        status: response.status,
        data: data,
        success: response.status === 200,
        endpoint: `/wallet/${userData._id}`
      });
      
      alert(`Wallet request status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      console.error('🔍 TokenDebugger: Wallet request failed:', error);
      setTestResults({
        status: 'ERROR',
        data: error.message,
        success: false,
        endpoint: '/wallet/{userId}'
      });
      alert(`Wallet request failed: ${error.message}`);
    }
  };

  const clearToken = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    checkToken();
    alert('Token and user data cleared!');
  };

  const setTestToken = () => {
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODhjYTM5ZGU5ZGU4ODJjZDgxOGM4YjUiLCJpYXQiOjE3NTQyODIzMzgsImV4cCI6MTc1NDQ2MjMzOCwidHlwZSI6ImFjY2VzcyJ9.573pDbKqSPPrbiBUhK6R2x1HPhiQDRcpwIKCxjUXLpc';
    localStorage.setItem('token', testToken);
    checkToken();
    alert('Test JWT token set!');
  };

  useEffect(() => {
    checkToken();
  }, []);

  return (
    <div className="debugger-container">
      <h2>🔍 Token Debugger</h2>
      
      <div className="debug-section">
        <h3>Current Token Status</h3>
        <div className="status-grid">
          <div className="status-item">
            <strong>Has Token:</strong> {tokenInfo.hasToken ? '✅ Yes' : '❌ No'}
          </div>
          <div className="status-item">
            <strong>Token Length:</strong> {tokenInfo.tokenLength}
          </div>
          <div className="status-item">
            <strong>Has User:</strong> {tokenInfo.hasUser ? '✅ Yes' : '❌ No'}
          </div>
          <div className="status-item">
            <strong>User ID:</strong> {tokenInfo.userInfo?._id || 'N/A'}
          </div>
        </div>
        
        {tokenInfo.tokenPreview && (
          <div className="token-preview">
            <strong>Token Preview:</strong>
            <code>{tokenInfo.tokenPreview}</code>
          </div>
        )}
      </div>

      <div className="debug-section">
        <h3>Test Actions</h3>
        <div className="button-grid">
          <button onClick={testTokenRequest} className="action-btn">
            Test /wallet/test Endpoint
          </button>
          <button onClick={testWithAxios} className="action-btn">
            Test with Axios
          </button>
          <button onClick={testWalletEndpoint} className="action-btn">
            Test Wallet Endpoint
          </button>
          <button onClick={setTestToken} className="action-btn secondary">
            Set Test JWT Token
          </button>
          <button onClick={clearToken} className="action-btn danger">
            Clear Token
          </button>
        </div>
      </div>

      {testResults && (
        <div className="debug-section">
          <h3>Last Test Results</h3>
          <div className={`test-result ${testResults.success ? 'success' : 'error'}`}>
            <div className="result-header">
              <strong>Status:</strong> {testResults.status}
              {testResults.endpoint && <span> | Endpoint: {testResults.endpoint}</span>}
            </div>
            <div className="result-data">
              <strong>Response:</strong>
              <pre>{JSON.stringify(testResults.data, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      <div className="debug-section">
        <h3>Manual Console Tests</h3>
        <div className="code-snippets">
          <div className="code-snippet">
            <strong>Check localStorage:</strong>
            <code>{`console.log('Token:', localStorage.getItem('token'));\nconsole.log('User:', localStorage.getItem('user'));`}</code>
          </div>
          <div className="code-snippet">
            <strong>Test fetch request:</strong>
            <code>{`fetch('http://localhost:5000/v1/wallet/test', {\n  headers: {\n    'Authorization': 'Bearer ' + localStorage.getItem('token')\n  }\n}).then(r => r.json()).then(console.log);`}</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenDebugger; 