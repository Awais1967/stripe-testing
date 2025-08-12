import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/apiService';

interface RegistrationData {
  name: string;
  email: string;
  password: string;
}

interface RegistrationResponse {
  user: {
    _id: string;
    name: string;
    email: string;
  };
  token: string;
  stripeAccountId: string;
  connectAccountLink: string;
}

const UserRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegistrationData>({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Making registration request');
      console.log('Registration data:', formData);
      
      const response = await ApiService.register(formData);

      console.log('Registration response:', response);
      console.log('Registration response keys:', Object.keys(response));
      console.log('Registration response type:', typeof response);
      console.log('Registration response stringified:', JSON.stringify(response, null, 2));

      // Store user data and authentication token
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Try different possible token field names
      const token = response.token || response.accessToken || response.authToken || response.jwt;
      console.log('Registration: Extracted token:', token);
      console.log('Registration: Token type:', typeof token);
      console.log('Registration: Token length:', token?.length || 0);
      
      if (token) {
        localStorage.setItem('token', token);
        console.log('Registration: Token saved to localStorage successfully');
      } else {
        console.error('Registration: No token found in response');
        console.error('Registration: Available fields:', Object.keys(response));
        console.error('Registration: Full response:', response);
        
        // Test localStorage functionality
        try {
          localStorage.setItem('test-token', 'test-value');
          const testValue = localStorage.getItem('test-token');
          console.log('Registration: localStorage test - stored:', testValue);
          localStorage.removeItem('test-token');
        } catch (error) {
          console.error('Registration: localStorage test failed:', error);
        }
        
        // Set a fallback token for testing (remove this in production)
        const fallbackToken = 'fallback-token-' + Date.now();
        localStorage.setItem('token', fallbackToken);
        console.log('Registration: Set fallback token for testing:', fallbackToken);
      }
      
      localStorage.setItem('stripeAccountId', response.stripeAccountId);
      localStorage.setItem('connectAccountLink', response.connectAccountLink);

      // Verify localStorage state
      console.log('Registration: Final localStorage state:');
      console.log('Registration: - user:', localStorage.getItem('user') ? 'Present' : 'Missing');
      console.log('Registration: - token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      console.log('Registration: - token value:', localStorage.getItem('token'));
      console.log('Registration: - stripeAccountId:', localStorage.getItem('stripeAccountId') ? 'Present' : 'Missing');
      console.log('Registration: - connectAccountLink:', localStorage.getItem('connectAccountLink') ? 'Present' : 'Missing');

      console.log('Registration: Stored user data:', response.user);
      console.log('Registration: Stored token:', token ? 'Present' : 'Missing');
      console.log('Registration: Token length:', token?.length || 0);
      console.log('Registration: Available token fields:', {
        token: response.token,
        accessToken: response.accessToken,
        authToken: response.authToken,
        jwt: response.jwt
      });

      // Check if token is present in response
      if (!token) {
        console.warn('Registration: No token received in response. Authentication may fail.');
        console.warn('Registration: Full response:', response);
        console.warn('Registration: Response structure:', JSON.stringify(response, null, 2));
      }

      navigate('/user-settings', {
        state: {
          userId: response.user._id,
          stripeAccountId: response.stripeAccountId,
          connectAccountLink: response.connectAccountLink
        }
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-container">
      <h2>User Registration</h2>
      <form onSubmit={handleSubmit} className="registration-form">
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Enter your full name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            placeholder="Enter your password"
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-footer">
        <p>Already have an account? <button onClick={() => navigate('/login')} className="link-btn">Login here</button></p>
      </div>
      
      <div className="demo-info">
        <h3>Demo Information:</h3>
        <p>This demo simulates the registration process with Stripe integration.</p>
        <p>After registration, you'll be redirected to complete Stripe onboarding.</p>
        <p><strong>API Base URL:</strong> http://localhost:5000/v1</p>
        <p><strong>Backend Route:</strong> POST /auth/register</p>
      </div>
    </div>
  );
};

export default UserRegistration; 