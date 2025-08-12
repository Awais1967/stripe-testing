import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/apiService';

interface LoginData {
  email: string;
  password: string;
}

const UserLogin: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginData>({
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
      console.log('Making login request');
      console.log('Login data:', formData);
      
      const response = await ApiService.login(formData);

      console.log('Login response:', response);
      console.log('Login response type:', typeof response);
      console.log('Login response keys:', Object.keys(response));

      // Handle different response formats
      let userData, tokenData;
      
      if (response.user && response.token) {
        // Standard format
        userData = response.user;
        tokenData = response.token;
      } else if (response.data && response.data.user && response.data.token) {
        // Wrapped in data object
        userData = response.data.user;
        tokenData = response.data.token;
      } else if (response.success && response.data) {
        // Success wrapper format
        userData = response.data.user || response.data;
        tokenData = response.data.token;
      } else if (response.user && response.tokens && response.tokens.access && response.tokens.access.token) {
        // Backend format with nested tokens
        userData = response.user;
        tokenData = response.tokens.access.token;
        console.log('✅ Using backend format with nested tokens');
      } else {
        // Log the full response for debugging
        console.error('Unexpected login response format:', response);
        throw new Error(`Invalid login response format. Expected user and token, got: ${JSON.stringify(response)}`);
      }

      // Store user data and token
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', tokenData);

      console.log('Login successful - navigating to user settings');
      navigate('/user-settings');
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      
      // Don't redirect on login failure, just show error
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      
      // Clear any invalid auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>User Login</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className="form-input"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="submit-btn"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="form-footer">
        <p>Don't have an account? <button onClick={() => navigate('/register')} className="link-btn">Register here</button></p>
      </div>
    </div>
  );
};

export default UserLogin; 