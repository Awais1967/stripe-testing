import React, { useState } from 'react';

const BackendTest: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBackend = async () => {
    setLoading(true);
    setResults([]);
    
    addResult('🔍 Testing backend connectivity...');
    
    try {
      // Test 1: Basic connectivity
      const response = await fetch('http://localhost:5000/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
      });
      
      addResult(`Backend responded with status: ${response.status}`);
      
      if (response.status === 401) {
        addResult('✅ Backend is reachable (401 is expected for invalid credentials)');
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

  const clearResults = () => setResults([]);

  return (
    <div className="debugger-container">
      <h2>🔍 Backend Test</h2>
      
      <div className="debug-section">
        <div className="button-grid">
          <button onClick={testBackend} className="action-btn" disabled={loading}>
            Test Backend
          </button>
          <button onClick={testRegistration} className="action-btn" disabled={loading}>
            Test Registration
          </button>
          <button onClick={testLogin} className="action-btn" disabled={loading}>
            Test Login
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
            <strong>Test backend:</strong>
            <code>{`fetch('http://localhost:5000/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
}).then(r => r.json()).then(console.log).catch(console.error);`}</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackendTest; 