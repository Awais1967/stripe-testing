import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/apiService';

interface OnboardingLinkResponse {
  connectAccountLink: string;
  stripeAccountId: string;
  expiresAt: string;
}

const StripeOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [onboardingLink, setOnboardingLink] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const APP_URL = process.env.REACT_APP_APP_URL || 'http://localhost:3000';
  const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_...';

  const generateOnboardingLink = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('No user data found. Please login again.');
      }

      const user = JSON.parse(userData);
      if (!user._id) {
        throw new Error('Invalid user data. User ID is missing.');
      }

      console.log('Generating onboarding link for user:', user._id);
      console.log('Return URL:', `${APP_URL}/user-settings`);

      // Check authentication
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token missing. Please login again.');
      }

      console.log('StripeOnboarding: Authentication token present:', !!token);
      console.log('StripeOnboarding: Token length:', token.length);

      const response = await ApiService.generateOnboardingLink({
        userId: user._id
      });

      console.log('Onboarding link response:', response);

      if (response.connectAccountLink) {
        setOnboardingLink(response.connectAccountLink);
        setSuccess('Onboarding link generated successfully!');
      } else {
        console.error('No connect account link in response:', response);
        throw new Error('No onboarding link received from server. Please try again.');
      }
    } catch (err: any) {
      console.error('Failed to generate onboarding link:', err);
      console.error('Error type:', err.constructor.name);
      console.error('Error stack:', err.stack);
      
      // Display user-friendly error message
      const errorMessage = err.message || 'Failed to generate onboarding link';
      setError(errorMessage);
      
      // Additional debugging information
      console.error('StripeOnboarding: Current user data:', localStorage.getItem('user'));
      console.error('StripeOnboarding: Authentication token:', !!localStorage.getItem('token'));
      console.error('StripeOnboarding: API base URL:', process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/v1');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOnboarding = () => {
    if (onboardingLink) {
      window.location.href = onboardingLink;
    }
  };

  const handleSimulateOnboarding = () => {
    setLoading(true);
    
    // Simulate the onboarding process
    setTimeout(() => {
      // Navigate back to user settings with success parameters
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const stripeAccountId = localStorage.getItem('stripeAccountId');
        
        const returnUrl = `${APP_URL}/user-settings?userId=${user._id}&stripeAccountId=${stripeAccountId}&onboarding_status=completed`;
        window.location.href = returnUrl;
      } else {
        setError('No user data found');
        setLoading(false);
      }
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('URL copied to clipboard!');
      setTimeout(() => setSuccess(''), 2000);
    }).catch(() => {
      setError('Failed to copy URL');
    });
  };

  const handleDismissError = () => setError('');
  const handleDismissSuccess = () => setSuccess('');

  return (
    <div className="stripe-onboarding-container">
      <h2>Stripe Connect Onboarding</h2>
      
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

      <div className="onboarding-section">
        <h3>Generate Onboarding Link</h3>
        <p>This will create a Stripe Connect onboarding link for your account.</p>
        
        <button 
          onClick={generateOnboardingLink} 
          disabled={loading}
          className="generate-btn"
        >
          {loading ? 'Generating...' : 'Generate Onboarding Link'}
        </button>

        {onboardingLink && (
          <div className="onboarding-link-section">
            <h4>Onboarding Link Generated</h4>
            <div className="link-display">
              <input 
                type="text" 
                value={onboardingLink} 
                readOnly 
                className="link-input"
              />
              <button 
                onClick={() => copyToClipboard(onboardingLink)}
                className="copy-btn"
              >
                Copy
              </button>
            </div>
            
            <div className="onboarding-actions">
              <button 
                onClick={handleStartOnboarding}
                className="start-btn"
              >
                Start Onboarding
              </button>
              
              <button 
                onClick={handleSimulateOnboarding}
                disabled={loading}
                className="simulate-btn"
              >
                {loading ? 'Simulating...' : 'Simulate Onboarding'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="user-summary">
        <h3>User Summary</h3>
        <div className="summary-info">
          {(() => {
            const userData = localStorage.getItem('user');
            const stripeAccountId = localStorage.getItem('stripeAccountId');
            
            if (userData) {
              const user = JSON.parse(userData);
              return (
                <>
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
                  <div className="info-item">
                    <label>Stripe Account ID:</label>
                    <span>{stripeAccountId || 'Not created'}</span>
                  </div>
                </>
              );
            }
            return <p>No user data found</p>;
          })()}
        </div>
      </div>

      <div className="environment-info">
        <h3>Environment Information</h3>
        <div className="env-grid">
          <div className="env-item">
            <label>API Base URL:</label>
            <span>http://localhost:5000/v1</span>
          </div>
          <div className="env-item">
            <label>App URL:</label>
            <span>{APP_URL}</span>
          </div>
          <div className="env-item">
            <label>Stripe Publishable Key:</label>
            <span>{STRIPE_PUBLISHABLE_KEY.substring(0, 20)}...</span>
          </div>
        </div>
      </div>

      <div className="navigation-actions">
        <button 
          onClick={() => navigate('/user-settings')}
          className="nav-btn"
        >
          Back to User Settings
        </button>
        
        <button 
          onClick={() => navigate('/wallet')}
          className="nav-btn"
        >
          Go to Wallet
        </button>
      </div>
    </div>
  );
};

export default StripeOnboarding; 