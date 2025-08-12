/**
 * Authentication Debugger Utility
 * 
 * This utility helps debug and fix authentication issues with the backend.
 * It provides tools to test different authentication methods and diagnose problems.
 */

export interface AuthTestResult {
  method: string;
  success: boolean;
  status?: number;
  message?: string;
  token?: string;
  response?: any;
}

export interface TokenInfo {
  token: string;
  isValid: boolean;
  decoded?: any;
  error?: string;
}

export class AuthDebugger {
  private static API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/v1';

  /**
   * Test different authentication methods
   */
  static async testAuthenticationMethods(userId: string): Promise<AuthTestResult[]> {
    const results: AuthTestResult[] = [];
    const token = localStorage.getItem('token');

    console.log('🔍 AuthDebugger: Testing authentication methods...');
    console.log('🔍 AuthDebugger: Available token:', token ? 'Present' : 'Missing');
    console.log('🔍 AuthDebugger: Token length:', token?.length || 0);

    // Test 1: No authentication
    try {
      console.log('🔍 AuthDebugger: Testing without authentication...');
      const response = await fetch(`${this.API_BASE_URL}/wallet/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      results.push({
        method: 'No Authentication',
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Success' : 'Failed'
      });
    } catch (error: any) {
      results.push({
        method: 'No Authentication',
        success: false,
        message: error.message
      });
    }

    // Test 2: Bearer token
    if (token) {
      try {
        console.log('🔍 AuthDebugger: Testing with Bearer token...');
        const response = await fetch(`${this.API_BASE_URL}/wallet/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        results.push({
          method: 'Bearer Token',
          success: response.ok,
          status: response.status,
          message: response.ok ? 'Success' : 'Failed',
          token: token.substring(0, 20) + '...'
        });
      } catch (error: any) {
        results.push({
          method: 'Bearer Token',
          success: false,
          message: error.message,
          token: token.substring(0, 20) + '...'
        });
      }
    }

    // Test 3: Raw token
    if (token) {
      try {
        console.log('🔍 AuthDebugger: Testing with raw token...');
        const response = await fetch(`${this.API_BASE_URL}/wallet/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          }
        });
        
        results.push({
          method: 'Raw Token',
          success: response.ok,
          status: response.status,
          message: response.ok ? 'Success' : 'Failed',
          token: token.substring(0, 20) + '...'
        });
      } catch (error: any) {
        results.push({
          method: 'Raw Token',
          success: false,
          message: error.message,
          token: token.substring(0, 20) + '...'
        });
      }
    }

    // Test 4: Test token
    try {
      console.log('🔍 AuthDebugger: Testing with test token...');
      const testToken = 'test-token-' + Date.now();
      const response = await fetch(`${this.API_BASE_URL}/wallet/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        }
      });
      
      results.push({
        method: 'Test Token',
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Success' : 'Failed',
        token: testToken.substring(0, 20) + '...'
      });
    } catch (error: any) {
      results.push({
        method: 'Test Token',
        success: false,
        message: error.message
      });
    }

    return results;
  }

  /**
   * Validate JWT token structure
   */
  static validateToken(token: string): TokenInfo {
    try {
      // Check if token has the right format (3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return {
          token,
          isValid: false,
          error: 'Invalid JWT format: should have 3 parts'
        };
      }

      // Try to decode the payload (second part)
      try {
        const payload = JSON.parse(atob(parts[1]));
        return {
          token,
          isValid: true,
          decoded: payload
        };
      } catch (error) {
        return {
          token,
          isValid: false,
          error: 'Invalid JWT payload: cannot decode'
        };
      }
    } catch (error: any) {
      return {
        token,
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Generate a test token for debugging
   */
  static generateTestToken(): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      userId: 'test-user-id',
      email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    }));
    const signature = 'test-signature';
    
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Clear all authentication data
   */
  static clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('🔍 AuthDebugger: Cleared all authentication data');
  }

  /**
   * Set test authentication data
   */
  static setTestAuthData(): void {
    const testToken = this.generateTestToken();
    const testUser = {
      _id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com'
    };

    localStorage.setItem('token', testToken);
    localStorage.setItem('user', JSON.stringify(testUser));
    
    console.log('🔍 AuthDebugger: Set test authentication data');
    console.log('🔍 AuthDebugger: Test token:', testToken.substring(0, 20) + '...');
  }

  /**
   * Get current authentication status
   */
  static getAuthStatus(): {
    hasToken: boolean;
    hasUser: boolean;
    tokenInfo?: TokenInfo;
    userInfo?: any;
  } {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    const result = {
      hasToken: !!token,
      hasUser: !!user,
      tokenInfo: token ? this.validateToken(token) : undefined,
      userInfo: user ? JSON.parse(user) : undefined
    };

    console.log('🔍 AuthDebugger: Current auth status:', result);
    return result;
  }

  /**
   * Test backend connectivity
   */
  static async testBackendConnectivity(): Promise<{
    reachable: boolean;
    response?: any;
    error?: string;
  }> {
    try {
      console.log('🔍 AuthDebugger: Testing backend connectivity...');
      const response = await fetch(`${this.API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          reachable: true,
          response: data
        };
      } else {
        return {
          reachable: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        reachable: false,
        error: error.message
      };
    }
  }

  /**
   * Comprehensive authentication diagnostic
   */
  static async runFullDiagnostic(): Promise<{
    backendConnectivity: any;
    authStatus: any;
    authTests: AuthTestResult[];
    recommendations: string[];
  }> {
    console.log('🔍 AuthDebugger: Running full diagnostic...');

    const backendConnectivity = await this.testBackendConnectivity();
    const authStatus = this.getAuthStatus();
    const authTests = await this.testAuthenticationMethods(authStatus.userInfo?._id || 'test-user-id');

    const recommendations: string[] = [];

    // Analyze results and provide recommendations
    if (!backendConnectivity.reachable) {
      recommendations.push('Backend is not reachable. Check if the server is running.');
    }

    if (!authStatus.hasToken) {
      recommendations.push('No authentication token found. Please login again.');
    }

    if (authStatus.tokenInfo && !authStatus.tokenInfo.isValid) {
      recommendations.push('Current token is invalid. Please login again.');
    }

    const successfulAuth = authTests.find(test => test.success);
    if (!successfulAuth) {
      recommendations.push('All authentication methods failed. Check backend authentication configuration.');
    }

    if (successfulAuth) {
      recommendations.push(`Use "${successfulAuth.method}" authentication method.`);
    }

    return {
      backendConnectivity,
      authStatus,
      authTests,
      recommendations
    };
  }
}

export default AuthDebugger; 