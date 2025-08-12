import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/v1';

export class WithdrawalApiService {
  // Create withdrawal request
  static async createWithdrawalRequest(data: {
    userId: string;
    amount: string;
  }) {
    console.log('API: Creating withdrawal request with data:', data);
    
    const token = localStorage.getItem('token');
    console.log('API: Using JWT token for withdrawal request authentication');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/payout/request`, {
        userId: data.userId,
        amount: data.amount
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

  // Get user's withdrawal requests
  static async getWithdrawalRequests(userId: string) {
    console.log('API: Getting withdrawal requests for user ID:', userId);
    
    const token = localStorage.getItem('token');
    console.log('API: Using JWT token for withdrawal requests authentication');
    // http://localhost:5000/v1/payout/requests
    try {
      const response = await axios.get(`${API_BASE_URL}/payout/requests`, {
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

  // Get all withdrawal requests (admin)
  static async getAllWithdrawalRequests() {
    console.log('API: Getting all withdrawal requests (admin)');
    
    const token = localStorage.getItem('token');
    console.log('API: Using JWT token for admin withdrawal requests authentication');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/payout/requests`, {
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

  // Process withdrawal request (approve/reject)
  static async processWithdrawalRequest(data: {
    requestId: string;
    action: 'approve' | 'reject';
    reason?: string;
  }) {
    console.log('API: Processing withdrawal request with data:', data);
    
    const token = localStorage.getItem('token');
    console.log('API: Using JWT token for withdrawal processing authentication');
    
    try {
      const endpoint = data.action === 'approve' 
        ? `${API_BASE_URL}/payout/approve/${data.requestId}`
        : `${API_BASE_URL}/payout/reject/${data.requestId}`;
      
      const response = await axios.post(endpoint, {}, {
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

  // Get withdrawal request by ID
  static async getWithdrawalRequest(requestId: string) {
    console.log('API: Getting withdrawal request by ID:', requestId);
    
    const token = localStorage.getItem('token');
    console.log('API: Using JWT token for withdrawal request authentication');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/payout/request/${requestId}`, {
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
      console.error('API: Failed to get withdrawal request');
      console.error('API: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed for withdrawal request. Please login again.');
      } else if (error.response?.status === 404) {
        throw new Error('Withdrawal request not found.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error getting withdrawal request. Please try again later.');
      } else {
        throw new Error(`Failed to get withdrawal request: ${error.response?.data?.message || error.message}`);
      }
    }
  }
}

