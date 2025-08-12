import React, { useState } from 'react';

const ResponseDebugger: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testLoginResponse = async () => {
    setLoading(true);
    setResults([]);
    
    addResult('🔍 Testing login response format...');
    
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
      
      addResult(`Response status: ${response.status}`);
      addResult(`Response data: ${JSON.stringify(data, null, 2)}`);
      addResult(`Response keys: ${Object.keys(data).join(', ')}`);
      
      if (data.user) {
        addResult(`✅ User found: ${JSON.stringify(data.user)}`);
      } else {
        addResult(`❌ No user in response`);
      }
      
      if (data.token) {
        addResult(`✅ Token found: ${data.token.substring(0, 50)}...`);
      } else {
        addResult(`❌ No token in response`);
      }
      
      if (data.message) {
        addResult(`ℹ️ Message: ${data.message}`);
      }
      
      if (data.error) {
        addResult(`❌ Error: ${data.error}`);
      }
      
    } catch (error: any) {
      addResult(`❌ Request failed: ${error.message}`);
    }
    
    setLoading(false);
  };

  const testRegistrationResponse = async () => {
    setLoading(true);
    addResult('🔍 Testing registration response format...');
    
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
      
      addResult(`Registration status: ${response.status}`);
      addResult(`Registration data: ${JSON.stringify(data, null, 2)}`);
      addResult(`Registration keys: ${Object.keys(data).join(', ')}`);
      
      if (data.user) {
        addResult(`✅ User found: ${JSON.stringify(data.user)}`);
      } else {
        addResult(`❌ No user in response`);
      }
      
      if (data.token) {
        addResult(`✅ Token found: ${data.token.substring(0, 50)}...`);
      } else {
        addResult(`❌ No token in response`);
      }
      
    } catch (error: any) {
      addResult(`❌ Registration failed: ${error.message}`);
    }
    
    setLoading(false);
  };

  const clearResults = () => setResults([]);

  return (
    <div className="debugger-container">
      <h2>🔍 Response Debugger</h2>
      
      <div className="debug-section">
        <div className="button-grid">
          <button onClick={testLoginResponse} className="action-btn" disabled={loading}>
            Test Login Response
          </button>
          <button onClick={testRegistrationResponse} className="action-btn" disabled={loading}>
            Test Registration Response
          </button>
          <button onClick={clearResults} className="action-btn secondary">
            Clear Results
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="debug-section">
          <h3>Response Analysis</h3>
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
        <h3>Expected Response Formats</h3>
        <div className="code-snippets">
          <div className="code-snippet">
            <strong>Format 1 (Standard):</strong>
            <code>{`{
  "user": { "_id": "...", "name": "...", "email": "..." },
  "token": "jwt-token-here"
}`}</code>
          </div>
          <div className="code-snippet">
            <strong>Format 2 (Wrapped):</strong>
            <code>{`{
  "data": {
    "user": { "_id": "...", "name": "...", "email": "..." },
    "token": "jwt-token-here"
  }
}`}</code>
          </div>
          <div className="code-snippet">
            <strong>Format 3 (Success):</strong>
            <code>{`{
  "success": true,
  "data": {
    "user": { "_id": "...", "name": "...", "email": "..." },
    "token": "jwt-token-here"
  }
}`}</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseDebugger; 