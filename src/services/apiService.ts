import axios from 'axios';

// Environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/v1';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable credentials for CORS
});

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  // Skip Authorization header for onboarding endpoint to avoid CORS issues
  const isOnboardingEndpoint = config.url?.includes('/wallet/onboarding/initiate');
  
  if (token && !isOnboardingEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
    
    // Debug token format
    console.log('API: Adding token to request:', {
      url: config.url,
      tokenLength: token.length,
      tokenPreview: token.substring(0, 50) + '...',
      headerValue: `Bearer ${token.substring(0, 20)}...`,
      tokenFormat: token.split('.').length === 3 ? 'JWT' : 'Other'
    });
  } else {
    console.log('API: No token or onboarding endpoint:', {
      url: config.url,
      hasToken: !!token,
      isOnboarding: isOnboardingEndpoint
    });
  }
  
  return config;
});

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access - but don't redirect during testing
      console.log('API: 401 Unauthorized - clearing auth data');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not on a debug page and not during login
      const currentPath = window.location.pathname;
      const isDebugPage = currentPath.includes('debugger') || currentPath.includes('test');
      const isLoginPage = currentPath === '/login';
      const isRegisterPage = currentPath === '/register';
      
      if (!isDebugPage && !isLoginPage && !isRegisterPage) {
        console.log('API: Redirecting to login due to 401 error');
        window.location.href = '/login';
      } else {
        console.log('API: Not redirecting - on debug/login/register page');
      }
    }
    return Promise.reject(error);
  }
);

// API service class
export class ApiService {
  // Auth endpoints
  static async register(userData: {
    name: string;
    email: string;
    password: string;
  }) {
    console.log('API: Making registration request with data:', userData);
    
    const response = await apiClient.post('/auth/register', userData);
    
    console.log('API: Registration response received');
    console.log('API: Response status:', response.status);
    console.log('API: Response data:', response.data);
    console.log('API: Response data keys:', Object.keys(response.data));
    console.log('API: Response data stringified:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  }

  static async login(credentials: {
    email: string;
    password: string;
  }) {
    console.log('API: Making login request with credentials:', { email: credentials.email });
    
    const response = await apiClient.post('/auth/login', credentials);
    
    console.log('API: Login response received:', {
      status: response.status,
      data: response.data,
      hasToken: !!response.data.token,
      hasUser: !!response.data.user,
      hasTokens: !!response.data.tokens,
      tokenLength: response.data.token?.length || 0,
      accessTokenLength: response.data.tokens?.access?.token?.length || 0,
      responseKeys: Object.keys(response.data)
    });
    
    // Validate token format - check both direct token and nested tokens
    const tokenToValidate = response.data.token || response.data.tokens?.access?.token;
    if (tokenToValidate) {
      const isValidToken = this.validateTokenFormat(tokenToValidate);
      console.log('API: Token validation:', { isValid: isValidToken });
      
      if (!isValidToken) {
        console.warn('API: Invalid token format received from backend');
      }
    } else {
      console.warn('API: No token in login response:', response.data);
    }
    
    return response.data;
  }

  // Helper method to validate JWT token format
  static validateTokenFormat(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('API: Invalid JWT format - should have 3 parts');
        return false;
      }
      
      // Try to decode the payload
      const payload = JSON.parse(atob(parts[1]));
      console.log('API: Token payload:', payload);
      
      return true;
    } catch (error) {
      console.error('API: Token validation failed:', error);
      return false;
    }
  }

  // Test token authentication with backend
  static async testTokenAuthentication(userId: string): Promise<{
    success: boolean;
    status: number;
    message: string;
    tokenInfo?: any;
  }> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return {
        success: false,
        status: 0,
        message: 'No token found in localStorage'
      };
    }

    console.log('API: Testing token authentication...');
    console.log('API: Token details:', {
      length: token.length,
      preview: token.substring(0, 50) + '...',
      isValidFormat: this.validateTokenFormat(token)
    });

    try {
      const response = await apiClient.get(`/wallet/${userId}`);
      
      return {
        success: true,
        status: response.status,
        message: 'Token authentication successful',
        tokenInfo: {
          length: token.length,
          isValidFormat: this.validateTokenFormat(token)
        }
      };
    } catch (error: any) {
      console.error('API: Token authentication failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        tokenLength: token.length
      });
      
      return {
        success: false,
        status: error.response?.status || 0,
        message: error.response?.data?.message || error.message,
        tokenInfo: {
          length: token.length,
          isValidFormat: this.validateTokenFormat(token)
        }
      };
    }
  }

  // Wallet endpoints
  static async getWallet(userId: string) {
    console.log('API: Getting wallet for user ID:', userId);
    
    try {
      const response = await apiClient.get(`/wallet/${userId}`);
      console.log('API: Wallet response:', response.data);
      
      // Handle different response formats
      const responseData = response.data;
      if (responseData.status === 'success' && responseData.data) {
        console.log('API: Extracted wallet data from success response:', responseData.data);
        return responseData.data;
      } else if (responseData.balance !== undefined) {
        console.log('API: Using direct wallet response:', responseData);
        return responseData;
      } else {
        console.log('API: Unknown wallet response format:', responseData);
        return responseData;
      }
    } catch (error: any) {
      console.error('API: Failed to get wallet');
      console.error('API: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // If 401 error, try alternative authentication methods
      if (error.response?.status === 401) {
        console.log('API: Trying alternative authentication methods...');
        return await this.tryAlternativeAuth(userId);
      }
      
      throw error;
    }
  }

  // Get wallet directly from wallet table
  static async getWalletDirect(userId: string) {
    console.log('API: Getting wallet directly from wallet table for user:', userId);
    
    try {
      const response = await apiClient.get(`/wallet/${userId}`);
      console.log('API: Direct wallet response:', response.data);
      
      // Handle different response formats
      const responseData = response.data;
      if (responseData.status === 'success' && responseData.data) {
        console.log('API: Extracted wallet data from success response:', responseData.data);
        return responseData.data;
      } else if (responseData.balance !== undefined) {
        console.log('API: Using direct wallet response:', responseData);
        return responseData;
      } else {
        console.log('API: Unknown wallet response format:', responseData);
        return responseData;
      }
    } catch (error: any) {
      console.error('API: Failed to get wallet directly');
      console.error('API: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // If 401 error, try alternative authentication methods
      if (error.response?.status === 401) {
        console.log('API: Trying alternative authentication methods for direct wallet...');
        return await this.tryAlternativeAuthDirect();
      }
      
      throw error;
    }
  }



  // Try alternative authentication methods for direct wallet
  private static async tryAlternativeAuthDirect(): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token available for alternative authentication');
    }

    const authMethods = [
      { name: 'Raw Token', value: token },
      { name: 'Token Prefix', value: `Token ${token}` },
      { name: 'Basic Auth', value: `Basic ${btoa(token + ':')}` }
    ];

    for (const method of authMethods) {
      try {
        console.log(`API: Trying ${method.name} authentication for direct wallet...`);
        
        const response = await axios.get(`${API_BASE_URL}/wallet`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': method.value
          }
        });
        
        console.log(`API: ${method.name} authentication successful for direct wallet!`);
        return response.data;
      } catch (error: any) {
        console.log(`API: ${method.name} authentication failed for direct wallet:`, error.response?.status);
      }
    }
    
    throw new Error('All authentication methods failed for direct wallet');
  }

  // Try alternative authentication methods
  private static async tryAlternativeAuth(userId: string): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token available for alternative authentication');
    }

    const authMethods = [
      { name: 'Raw Token', value: token },
      { name: 'Token Prefix', value: `Token ${token}` },
      { name: 'Basic Auth', value: `Basic ${btoa(token + ':')}` }
    ];

    for (const method of authMethods) {
      try {
        console.log(`API: Trying ${method.name} authentication...`);
        
        const response = await axios.get(`${API_BASE_URL}/wallet/${userId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': method.value
          }
        });
        
        console.log(`API: ${method.name} authentication successful!`);
        return response.data;
      } catch (error: any) {
        console.log(`API: ${method.name} authentication failed:`, error.response?.status);
      }
    }
    
    throw new Error('All authentication methods failed');
  }

  static async deposit(data: {
    userId: string;
    amount: number;
  }) {
    console.log('API: Making deposit request with data:', data);
    
    const token = localStorage.getItem('token');
    console.log('API: Using JWT token for deposit authentication');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/wallet/deposit/${data.userId}`, {
        userId: data.userId,
        amount: data.amount
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        timeout: 10000
      });
      
      console.log('API: Deposit response:', response.data);
      
      // Handle the backend response format
      const responseData = response.data;
      if (responseData.status === 'success' && responseData.data) {
        console.log('API: Extracted deposit data:', responseData.data);
        return responseData.data;
      } else {
        console.log('API: Using deposit response directly:', responseData);
        return responseData;
      }
    } catch (error: any) {
      console.error('API: Deposit request failed');
      console.error('API: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed for deposit. Please login again.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid deposit request. Please check amount.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error during deposit. Please try again later.');
      } else {
        throw new Error(`Deposit failed: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  static async withdraw(data: {
    userId: string;
    amount: number;
  }) {
    console.log('API: Making withdraw request with data:', data);
    
    const token = localStorage.getItem('token');
    console.log('API: Using JWT token for withdraw authentication');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/wallet/withdraw/${data.userId}`, {
        userId: data.userId,
        amount: data.amount
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        timeout: 10000
      });
      
      console.log('API: Withdraw response:', response.data);
      
      // Handle the backend response format
      const responseData = response.data;
      if (responseData.status === 'success' && responseData.data) {
        console.log('API: Extracted withdraw data:', responseData.data);
        return responseData.data;
      } else {
        console.log('API: Using withdraw response directly:', responseData);
        return responseData;
      }
    } catch (error: any) {
      console.error('API: Withdraw request failed');
      console.error('API: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed for withdraw. Please login again.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid withdraw request. Please check amount.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error during withdraw. Please try again later.');
      } else {
        throw new Error(`Withdraw failed: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  static async generateOnboardingLink(data: {
    userId: string;
  }) {
    console.log('API: Making onboarding request with data:', data);
    console.log('API: Base URL:', API_BASE_URL);
    console.log('API: Full URL:', `${API_BASE_URL}/wallet/onboarding/initiate/${data.userId}`);
    
    try {
      // Get the proper JWT token from localStorage
      const token = localStorage.getItem('token');
      console.log('API: Using JWT token for authentication');
      
      if (!token) {
        console.warn('API: No JWT token found, this might cause authentication issues');
      }
      
      const response = await axios.post(`${API_BASE_URL}/wallet/onboarding/initiate/${data.userId}`, {
        userId: data.userId
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        timeout: 10000
      });
      
      console.log('API: Onboarding response:', response.data);
      
      // Handle the actual backend response format
      const responseData = response.data;
      if (responseData.status === 'success' && responseData.data) {
        console.log('API: Extracted data from response:', responseData.data);
        return responseData.data; // Return the data object directly
      } else {
        console.log('API: Using response data directly:', responseData);
        return responseData; // Fallback to direct response
      }
    } catch (error: any) {
      console.error('API: Onboarding request failed');
      console.error('API: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data
        }
      });
      
      // Try fallback approach without any headers if CORS fails
      if (error.message.includes('CORS') || error.message.includes('Network Error')) {
        console.log('API: Trying fallback request without headers...');
        try {
          const fallbackResponse = await axios.post(`${API_BASE_URL}/wallet/onboarding/initiate/${data.userId}`, {
            userId: data.userId
          });
          
          console.log('API: Fallback response successful:', fallbackResponse.data);
          const responseData = fallbackResponse.data;
          if (responseData.status === 'success' && responseData.data) {
            return responseData.data;
          } else {
            return responseData;
          }
        } catch (fallbackError: any) {
          console.error('API: Fallback request also failed:', fallbackError);
        }
      }
      
      // Try different authentication formats if 401 error
      if (error.response?.status === 401) {
        console.log('API: Trying different authentication formats...');
        
        const token = localStorage.getItem('token') || 'test-token-' + Date.now();
        
        // Try different token formats
        const authFormats = [
          `Bearer ${token}`,
          `Token ${token}`,
          token,
          `Basic ${btoa(token + ':')}`
        ];
        
        for (const authFormat of authFormats) {
          try {
            console.log('API: Trying auth format:', authFormat.substring(0, 20) + '...');
            
            const authResponse = await axios.post(`${API_BASE_URL}/wallet/onboarding/initiate/${data.userId}`, {
              userId: data.userId
            }, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authFormat
              },
              timeout: 10000
            });
            
            console.log('API: Authentication successful with format:', authFormat.substring(0, 20) + '...');
            const responseData = authResponse.data;
            if (responseData.status === 'success' && responseData.data) {
              return responseData.data;
            } else {
              return responseData;
            }
          } catch (authError: any) {
            console.log('API: Auth format failed:', authFormat.substring(0, 20) + '...', authError.response?.status);
          }
        }
      }
      
      // Provide specific error messages based on status codes
      if (error.response?.status === 401) {
        console.error('API: 401 Unauthorized - Full error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // Check if the backend is actually returning any useful information
        if (error.response.data) {
          console.error('API: Backend error message:', error.response.data);
        }
        
        throw new Error('Authentication failed. Please login again.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. You may not have permission to access this resource.');
      } else if (error.response?.status === 404) {
        throw new Error('Onboarding endpoint not found. Please check if the backend service is running.');
      } else if (error.response?.status === 422) {
        throw new Error('Invalid request data. Please check the user ID format.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error. Please check your internet connection and ensure the backend is running.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. The server is taking too long to respond.');
      } else {
        throw new Error(`Request failed: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  static async updateAfterOnboarding(data: {
    userId: string;
    stripeAccountId: string;
    onboardingStatus?: string;
  }) {
    const response = await apiClient.post(`/wallet/${data.userId}/onboarding/update`, {
      stripeAccountId: data.stripeAccountId,
      onboardingStatus: data.onboardingStatus
    });
    return response.data;
  }

  // Challenge endpoints
  static async getChallenges(userId: string) {
    // Backend exposes GET /v1/challenge/pending/:userId
    const response = await apiClient.get(`/challenge/pending/${userId}`);
    return response.data;
  }

  static async getChallenge(challengeId: string) {
    const response = await apiClient.get(`/challenges/${challengeId}`);
    return response.data;
  }

  static async createChallenge(data: {
    title: string;
    description: string;
    hostId: string;
    opponentId?: string;
  }) {
    const response = await apiClient.post('/challenges', data);
    return response.data;
  }

  static async updateChallenge(challengeId: string, data: any) {
    const response = await apiClient.put(`/challenges/${challengeId}`, data);
    return response.data;
  }

  static async joinChallenge(challengeId: string, userId: string) {
    // Backend expects POST /v1/challenge/join with body { challenge_id, user_id }
    const response = await apiClient.post(`/challenge/join`, {
      challenge_id: challengeId,
      user_id: userId
    });
    return response.data;
  }

  static async leaveChallenge(challengeId: string, userId: string) {
    const response = await apiClient.post(`/challenges/${challengeId}/leave`, {
      userId
    });
    return response.data;
  }

  // User endpoints
  static async getUserProfile(userId: string) {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  }

  static async updateUserProfile(userId: string, data: any) {
    const response = await apiClient.put(`/users/${userId}`, data);
    return response.data;
  }

  // Stream endpoints
  static async getStreamParticipants(challengeId: string) {
    const response = await apiClient.get(`/streams/${challengeId}/participants`);
    return response.data;
  }

  static async joinStream(challengeId: string, userId: string, isViewer: boolean = false) {
    const response = await apiClient.post(`/streams/${challengeId}/join`, {
      userId,
      isViewer
    });
    return response.data;
  }

  static async leaveStream(challengeId: string, userId: string) {
    const response = await apiClient.post(`/streams/${challengeId}/leave`, {
      userId
    });
    return response.data;
  }

  // Top-up endpoints
  static async initiateTopup(data: {
    userId: string;
    amount: number;
    currency?: string;
  }) {
    console.log('API: Initiating top-up with data:', data);
    console.log('API: Top-up URL:', `${API_BASE_URL}/wallet/topup/initiate/${data.userId}`);
    
    const token = localStorage.getItem('token');
    console.log('API: Using JWT token for top-up authentication');
    console.log('API: Token present:', !!token);
    
    try {
      const requestBody = {
        amount: data.amount,
        currency: data.currency || 'usd'
      };
      
      console.log('API: Request body being sent:', requestBody);
      console.log('API: User ID in URL:', data.userId);
      
      const response = await axios.post(`${API_BASE_URL}/wallet/topup/initiate/${data.userId}`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        timeout: 10000
      });
      
      console.log('API: Top-up response:', response.data);
      
      // Handle the backend response format
      const responseData = response.data;
      if (responseData.status === 'success' && responseData.data) {
        console.log('API: Extracted top-up data:', responseData.data);
        return responseData.data;
      } else {
        console.log('API: Using top-up response directly:', responseData);
        return responseData;
      }
    } catch (error: any) {
      console.error('API: Top-up request failed');
      console.error('API: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        requestBody: error.config?.data
      });
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed for top-up. Please login again.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid top-up request. Please check amount and currency.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error during top-up. Please try again later.');
      } else {
        throw new Error(`Top-up failed: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  // Update wallet balance after successful payment
  static async updateWalletBalance(data: {
    userId: string;
    amount: number;
    currency: string;
    paymentIntentId: string;
    status: 'completed' | 'failed' | 'pending';
  }) {
    console.log('API: Updating wallet balance with data:', data);
    
    const token = localStorage.getItem('token');
    console.log('API: Using JWT token for wallet update');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/wallet/deposit/${data.userId}`, {
        userId: data.userId,
        amount: data.amount,
        currency: data.currency,
        paymentIntentId: data.paymentIntentId,
        status: data.status
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        timeout: 10000
      });
      
      console.log('API: Wallet balance update response:', response.data);
      
      // Handle the backend response format
      const responseData = response.data;
      if (responseData.status === 'success' && responseData.data) {
        console.log('API: Extracted wallet update data:', responseData.data);
        return responseData.data;
      } else {
        console.log('API: Using wallet update response directly:', responseData);
        return responseData;
      }
    } catch (error: any) {
      console.error('API: Wallet balance update failed');
      console.error('API: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed for wallet update. Please login again.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid wallet update request. Please check payment details.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error during wallet update. Please try again later.');
      } else {
        throw new Error(`Wallet update failed: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  // Test backend connectivity
  static async testBackendConnection() {
    try {
      console.log('API: Testing backend connection...');
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000
      });
      console.log('API: Backend is accessible:', response.status);
      return true;
    } catch (error: any) {
      console.error('API: Backend connection test failed:', error.message);
      return false;
    }
  }

  // Withdrawal Request endpoints
  static async createWithdrawalRequest(data: {
    userId: string;
    amount: number;
    currency: string;
  }) {
    console.log('API: Creating withdrawal request with data:', data);
    
    const token = localStorage.getItem('token');
    console.log('API: Using JWT token for withdrawal request authentication');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/wallet/withdrawal/request`, {
        userId: data.userId,
        amount: data.amount,
        currency: data.currency
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        timeout: 10000
      });
      
      console.log('API: Withdrawal request response:', response.data);
      
      // Handle the backend response format
      const responseData = response.data;
      if (responseData.status === 'success' && responseData.data) {
        console.log('API: Extracted withdrawal request data:', responseData.data);
        return responseData.data;
      } else {
        console.log('API: Using withdrawal request response directly:', responseData);
        return responseData;
      }
    } catch (error: any) {
      console.error('API: Withdrawal request failed');
      console.error('API: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed for withdrawal request. Please login again.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid withdrawal request. Please check amount and balance.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error during withdrawal request. Please try again later.');
      } else {
        throw new Error(`Withdrawal request failed: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  static async getWithdrawalRequests(userId: string) {
    console.log('API: Getting withdrawal requests for user ID:', userId);
    
    const token = localStorage.getItem('token');
    console.log('API: Using JWT token for withdrawal requests authentication');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/wallet/withdrawal/requests/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        timeout: 10000
      });
      
      console.log('API: Withdrawal requests response:', response.data);
      
      // Handle the backend response format
      const responseData = response.data;
      if (responseData.status === 'success' && responseData.data) {
        console.log('API: Extracted withdrawal requests data:', responseData.data);
        return responseData.data;
      } else {
        console.log('API: Using withdrawal requests response directly:', responseData);
        return responseData;
      }
    } catch (error: any) {
      console.error('API: Failed to get withdrawal requests');
      console.error('API: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed for withdrawal requests. Please login again.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error getting withdrawal requests. Please try again later.');
      } else {
        throw new Error(`Failed to get withdrawal requests: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  static async getAllWithdrawalRequests() {
    console.log('API: Getting all withdrawal requests (admin)');
    
    const token = localStorage.getItem('token');
    console.log('API: Using JWT token for admin withdrawal requests authentication');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/wallet/withdrawal/requests`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        timeout: 10000
      });
      
      console.log('API: All withdrawal requests response:', response.data);
      
      // Handle the backend response format
      const responseData = response.data;
      if (responseData.status === 'success' && responseData.data) {
        console.log('API: Extracted all withdrawal requests data:', responseData.data);
        return responseData.data;
      } else {
        console.log('API: Using all withdrawal requests response directly:', responseData);
        return responseData;
      }
    } catch (error: any) {
      console.error('API: Failed to get all withdrawal requests');
      console.error('API: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed for admin withdrawal requests. Please login again.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. Admin privileges required.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error getting all withdrawal requests. Please try again later.');
      } else {
        throw new Error(`Failed to get all withdrawal requests: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  static async processWithdrawalRequest(data: {
    requestId: string;
    action: 'approve' | 'reject';
    reason?: string;
  }) {
    console.log('API: Processing withdrawal request with data:', data);
    
    const token = localStorage.getItem('token');
    console.log('API: Using JWT token for withdrawal processing authentication');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/wallet/withdrawal/process`, {
        requestId: data.requestId,
        action: data.action,
        reason: data.reason
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        timeout: 15000
      });
      
      console.log('API: Withdrawal processing response:', response.data);
      
      // Handle the backend response format
      const responseData = response.data;
      if (responseData.status === 'success' && responseData.data) {
        console.log('API: Extracted withdrawal processing data:', responseData.data);
        return responseData.data;
      } else {
        console.log('API: Using withdrawal processing response directly:', responseData);
        return responseData;
      }
    } catch (error: any) {
      console.error('API: Withdrawal processing failed');
      console.error('API: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed for withdrawal processing. Please login again.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. Admin privileges required.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid withdrawal processing request. Please check request details.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error during withdrawal processing. Please try again later.');
      } else {
        throw new Error(`Withdrawal processing failed: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  // Test different authentication methods
  static async testAuthenticationMethods(userId: string) {
    const token = localStorage.getItem('token');
    const authMethods = [
      { name: 'Bearer JWT', value: token ? `Bearer ${token}` : null },
      { name: 'Raw JWT', value: token },
      { name: 'None', value: null }
    ];
    
    console.log('API: Testing authentication methods...');
    console.log('API: Available JWT token:', token ? 'Present' : 'Missing');
    
    for (const method of authMethods) {
      try {
        const headers: any = {
          'Content-Type': 'application/json'
        };
        
        if (method.value) {
          headers.Authorization = method.value;
        }
        
        console.log(`API: Testing ${method.name} authentication...`);
        
        const response = await axios.post(`${API_BASE_URL}/wallet/onboarding/initiate/${userId}`, {
          userId: userId
        }, {
          headers,
          timeout: 5000
        });
        
        console.log(`API: ${method.name} authentication successful!`);
        return { method: method.name, success: true, response: response.data };
      } catch (error: any) {
        console.log(`API: ${method.name} authentication failed:`, error.response?.status);
      }
    }
    
    console.log('API: All authentication methods failed');
    return { method: 'None', success: false };
  }

  // Comprehensive test for onboarding endpoint
  static async testOnboardingEndpoint(userId: string) {
    console.log('API: Comprehensive onboarding endpoint test...');
    
    const token = localStorage.getItem('token');
    console.log('API: Available JWT token:', token ? 'Present' : 'Missing');
    
    const testCases = [
      {
        name: 'Bearer JWT Token',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : 'Bearer test-token'
        },
        body: { userId }
      },
      {
        name: 'Raw JWT Token',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token || 'test-token'
        },
        body: { userId }
      },
      {
        name: 'No Authentication',
        headers: { 'Content-Type': 'application/json' },
        body: { userId }
      },
      {
        name: 'No Body',
        headers: { 'Content-Type': 'application/json' },
        body: {}
      }
    ];
    
    for (const testCase of testCases) {
      try {
        console.log(`API: Testing ${testCase.name}...`);
        
        const config: any = {
          headers: testCase.headers,
          timeout: 5000
        };
        
        const response = await axios.post(`${API_BASE_URL}/wallet/onboarding/initiate/${userId}`, testCase.body, config);
        
        console.log(`API: ${testCase.name} SUCCESS:`, response.data);
        return { method: testCase.name, success: true, data: response.data };
      } catch (error: any) {
        console.log(`API: ${testCase.name} FAILED:`, error.response?.status, error.response?.data);
      }
    }
    
    console.log('API: All test cases failed');
    return { method: 'None', success: false };
  }

  // Test top-up endpoint
  static async testTopupEndpoint(userId: string) {
    console.log('API: Testing top-up endpoint...');
    
    const token = localStorage.getItem('token');
    const testCases = [
      {
        name: 'With Authentication',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: { amount: 10, currency: 'usd' }
      },
      {
        name: 'Without Authentication',
        headers: { 'Content-Type': 'application/json' },
        body: { amount: 10, currency: 'usd' }
      },
      {
        name: 'Minimal Request',
        headers: { 'Content-Type': 'application/json' },
        body: {}
      }
    ];
    
    for (const testCase of testCases) {
      try {
        console.log(`API: Testing ${testCase.name}...`);
        
        const response = await axios.post(`${API_BASE_URL}/wallet/topup/initiate/${userId}`, testCase.body, {
          headers: testCase.headers,
          timeout: 5000
        });
        
        console.log(`API: ${testCase.name} SUCCESS:`, response.data);
        return { method: testCase.name, success: true, data: response.data };
      } catch (error: any) {
        console.log(`API: ${testCase.name} FAILED:`, error.response?.status, error.response?.data);
      }
    }
    
    console.log('API: All top-up test cases failed');
    return { method: 'None', success: false };
  }
}

// Export the API service and axios instance
export default ApiService; 