import React, { useState } from 'react';
import AuthDebugger, { AuthTestResult } from '../utils/authDebugger';

const AuthDebuggerComponent: React.FC = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<any>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const results = await AuthDebugger.runFullDiagnostic();
      setDiagnosticResults(results);
      console.log('🔍 AuthDebugger: Diagnostic results:', results);
    } catch (error) {
      console.error('🔍 AuthDebugger: Diagnostic failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAuthStatus = () => {
    const status = AuthDebugger.getAuthStatus();
    setAuthStatus(status);
    console.log('🔍 AuthDebugger: Auth status:', status);
  };

  const clearAuthData = () => {
    AuthDebugger.clearAuthData();
    checkAuthStatus();
    alert('Authentication data cleared!');
  };

  const setTestAuthData = () => {
    AuthDebugger.setTestAuthData();
    checkAuthStatus();
    alert('Test authentication data set!');
  };

  const getCategoryColor = (success: boolean) => {
    return success ? '#10b981' : '#ef4444';
  };

  return (
    <div className="auth-debugger-container">
      <div className="auth-debugger-header">
        <h2>🔍 Authentication Debugger</h2>
        <p className="auth-debugger-description">
          Debug and fix authentication issues with your backend. This tool helps diagnose
          JWT token problems and test different authentication methods.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>⚡ Quick Actions</h3>
        <div className="action-buttons">
          <button 
            onClick={checkAuthStatus}
            className="action-btn primary"
          >
            Check Auth Status
          </button>
          
          <button 
            onClick={runDiagnostic}
            disabled={loading}
            className="action-btn primary"
          >
            {loading ? 'Running Diagnostic...' : 'Run Full Diagnostic'}
          </button>
          
          <button 
            onClick={setTestAuthData}
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
        </div>
      </div>

      {/* Current Auth Status */}
      {authStatus && (
        <div className="auth-status-section">
          <h3>📊 Current Authentication Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Has Token:</span>
              <span 
                className="status-value"
                style={{ color: authStatus.hasToken ? '#10b981' : '#ef4444' }}
              >
                {authStatus.hasToken ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            
            <div className="status-item">
              <span className="status-label">Has User:</span>
              <span 
                className="status-value"
                style={{ color: authStatus.hasUser ? '#10b981' : '#ef4444' }}
              >
                {authStatus.hasUser ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            
            {authStatus.tokenInfo && (
              <div className="status-item">
                <span className="status-label">Token Valid:</span>
                <span 
                  className="status-value"
                  style={{ color: authStatus.tokenInfo.isValid ? '#10b981' : '#ef4444' }}
                >
                  {authStatus.tokenInfo.isValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
            )}
          </div>
          
          {authStatus.tokenInfo && !authStatus.tokenInfo.isValid && (
            <div className="error-message">
              <strong>Token Error:</strong> {authStatus.tokenInfo.error}
            </div>
          )}
          
          {authStatus.userInfo && (
            <div className="user-info">
              <h4>User Information:</h4>
              <pre>{JSON.stringify(authStatus.userInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Diagnostic Results */}
      {diagnosticResults && (
        <div className="diagnostic-results">
          <h3>🔬 Diagnostic Results</h3>
          
          {/* Backend Connectivity */}
          <div className="result-section">
            <h4>🌐 Backend Connectivity</h4>
            <div className="result-item">
              <span className="result-label">Status:</span>
              <span 
                className="result-value"
                style={{ color: getCategoryColor(diagnosticResults.backendConnectivity.reachable) }}
              >
                {diagnosticResults.backendConnectivity.reachable ? '✅ Reachable' : '❌ Not Reachable'}
              </span>
            </div>
            {diagnosticResults.backendConnectivity.error && (
              <div className="error-message">
                <strong>Error:</strong> {diagnosticResults.backendConnectivity.error}
              </div>
            )}
          </div>

          {/* Authentication Tests */}
          <div className="result-section">
            <h4>🔐 Authentication Tests</h4>
            <div className="auth-tests-grid">
              {diagnosticResults.authTests.map((test: AuthTestResult, index: number) => (
                <div key={index} className="auth-test-item">
                  <div className="test-header">
                    <span className="test-method">{test.method}</span>
                    <span 
                      className="test-status"
                      style={{ color: getCategoryColor(test.success) }}
                    >
                      {test.success ? '✅ Success' : '❌ Failed'}
                    </span>
                  </div>
                  <div className="test-details">
                    {test.status && <span>Status: {test.status}</span>}
                    {test.message && <span>Message: {test.message}</span>}
                    {test.token && <span>Token: {test.token}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="result-section">
            <h4>💡 Recommendations</h4>
            <div className="recommendations">
              {diagnosticResults.recommendations.length > 0 ? (
                <ul>
                  {diagnosticResults.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              ) : (
                <p>✅ No issues detected! Authentication is working properly.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="instructions-section">
        <h3>📋 How to Fix Authentication Issues</h3>
        <div className="instructions">
          <h4>1. Check Backend Status</h4>
          <p>Ensure your backend server is running on the correct port (usually 5000).</p>
          
          <h4>2. Verify JWT Token</h4>
          <p>Make sure you have a valid JWT token. If not, login again to get a fresh token.</p>
          
          <h4>3. Check Token Format</h4>
          <p>JWT tokens should have 3 parts separated by dots (header.payload.signature).</p>
          
          <h4>4. Test Authentication Methods</h4>
          <p>Use the diagnostic tool to test different authentication methods and see which one works.</p>
          
          <h4>5. Check Backend Configuration</h4>
          <p>Ensure your backend is properly configured to accept JWT tokens and has the correct secret key.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthDebuggerComponent; 