import React, { useState } from 'react';

const SimpleAuthTest: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBackendConnection = async () => {
    setLoading(true);
    setResults([]);
    
    addResult('🔍 Starting backend connection test...');
    
    try {
      // Test 1: Simple GET request to see if backend responds
      addResult('Testing basic backend connectivity...');
      const response = await fetch('http://localhost:5000/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
      });
      
      addResult(`Backend responded with status: ${response.status}`);
      
      if (response.status === 401) {
        addResult('✅ Backend is reachable but login failed (expected)');
      } else if (response.status === 404) {
        addResult('❌ Backend endpoint not found');
      } else {
        addResult(`✅ Backend is reachable (status: ${response.status})`);
      }
      
    } catch (error: any) {
      addResult(`❌ Backend connection failed: ${error.message}`);
    }
    
    setLoading(false);
  };

  const testRegistration = async () => {
    setLoading(true);
    addResult('🔍 Testing user registration...');
    
    try {
      const response = await fetch('http://localhost:5000/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        })
      });
      
      const data = await response.json();
      addResult(`Registration response: ${response.status} - ${JSON.stringify(data)}`);
      
      if (response.ok) {
        addResult('✅ Registration successful!');
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          addResult('✅ Token stored in localStorage');
        }
      } else {
        addResult(`❌ Registration failed: ${data.message || 'Unknown error'}`);
      }
      
    } catch (error: any) {
      addResult(`❌ Registration error: ${error.message}`);
    }
    
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    addResult('🔍 Testing user login...');
    
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
      addResult(`Login response: ${response.status} - ${JSON.stringify(data)}`);
      
      if (response.ok && data.token) {
        addResult('✅ Login successful!');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        addResult('✅ Token stored in localStorage');
      } else {
        addResult(`❌ Login failed: ${data.message || 'Unknown error'}`);
      }
      
    } catch (error: any) {
      addResult(`❌ Login error: ${error.message}`);
    }
    
    setLoading(false);
  };

  const testWalletAccess = async () => {
    setLoading(true);
    addResult('🔍 Testing wallet access...');
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token) {
      addResult('❌ No token found - please login first');
      setLoading(false);
      return;
    }
    
    try {
      const userData = user ? JSON.parse(user) : null;
      const userId = userData?._id || 'test-user-id';
      
      addResult(`Testing wallet access for user: ${userId}`);
      
      const response = await fetch(`http://localhost:5000/v1/wallet/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      addResult(`Wallet response: ${response.status} - ${JSON.stringify(data)}`);
      
      if (response.ok) {
        addResult('✅ Wallet access successful!');
      } else {
        addResult(`❌ Wallet access failed: ${data.message || 'Unknown error'}`);
      }
      
    } catch (error: any) {
      addResult(`❌ Wallet access error: ${error.message}`);
    }
    
    setLoading(false);
  };

  const clearResults = () => setResults([]);

  const checkLocalStorage = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    addResult('🔍 Checking localStorage...');
    addResult(`Token: ${token ? 'Present' : 'Missing'}`);
    addResult(`User: ${user ? 'Present' : 'Missing'}`);
    
    if (token) {
      addResult(`Token preview: ${token.substring(0, 50)}...`);
    }
  };

  return (
    <div className="debugger-container">
      <h2>🔍 Simple Authentication Test</h2>
      
      <div className="debug-section">
        <div className="button-grid">
          <button onClick={testBackendConnection} className="action-btn" disabled={loading}>
            Test Backend Connection
          </button>
          <button onClick={testRegistration} className="action-btn" disabled={loading}>
            Test Registration
          </button>
          <button onClick={testLogin} className="action-btn" disabled={loading}>
            Test Login
          </button>
          <button onClick={testWalletAccess} className="action-btn" disabled={loading}>
            Test Wallet Access
          </button>
          <button onClick={checkLocalStorage} className="action-btn secondary">
            Check localStorage
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
              <div key={index} className="result-item">
                <div className="result-message">{result}</div>
              </div>
            ))}
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
            <strong>Test registration:</strong>
            <code>{`fetch('http://localhost:5000/v1/auth/register', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    name: 'Test User',\n    email: 'test@example.com',\n    password: 'password123'\n  })\n}).then(r => r.json()).then(console.log);`}</code>
          </div>
          <div className="code-snippet">
            <strong>Test login:</strong>
            <code>{`fetch('http://localhost:5000/v1/auth/login', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    email: 'test@example.com',\n    password: 'password123'\n  })\n}).then(r => r.json()).then(console.log);`}</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleAuthTest; 