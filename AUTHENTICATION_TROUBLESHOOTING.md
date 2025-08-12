# Authentication Troubleshooting Guide

## Current Issue
You're getting the error: `"Please authenticate"` with a 401 status code.

This indicates that your JWT token is either:
- Missing
- Invalid/expired
- Not being sent correctly
- Not being accepted by the backend

## Quick Fix Steps

### 1. Clear and Reset Authentication
1. Go to `/auth-debugger` in your app
2. Click "Clear Auth Data" to remove any invalid tokens
3. Click "Set Test Auth Data" to set fresh test data
4. Try accessing your wallet again

### 2. Check Backend Status
1. Ensure your backend server is running on port 5000
2. Check if the backend is accessible at `http://localhost:5000/v1/health`
3. Verify the backend logs for any errors

### 3. Login Again
1. Navigate to `/login`
2. Enter your credentials
3. Check if a new token is generated
4. Try accessing protected routes

## Detailed Diagnostic

### Step 1: Run Authentication Diagnostic
1. Go to `/auth-debugger`
2. Click "Run Full Diagnostic"
3. Review the results:
   - **Backend Connectivity**: Should show "✅ Reachable"
   - **Authentication Tests**: Check which methods work
   - **Recommendations**: Follow the suggested fixes

### Step 2: Check Token Status
1. Click "Check Auth Status"
2. Verify:
   - **Has Token**: Should be "✅ Yes"
   - **Token Valid**: Should be "✅ Valid"
   - **Has User**: Should be "✅ Yes"

### Step 3: Test Different Authentication Methods
The diagnostic will test:
- **No Authentication**: Should fail (401)
- **Bearer Token**: Should succeed if token is valid
- **Raw Token**: Alternative format
- **Test Token**: For debugging

## Common Issues and Solutions

### Issue 1: "No authentication token found"
**Solution:**
1. Clear all authentication data
2. Login again to get a fresh token
3. Check browser console for any errors during login

### Issue 2: "Invalid JWT format"
**Solution:**
1. The token should have 3 parts separated by dots
2. Clear authentication data and login again
3. Check if the backend is generating proper JWT tokens

### Issue 3: "Token expired"
**Solution:**
1. JWT tokens typically expire after 1 hour
2. Login again to get a fresh token
3. Check backend token expiration settings

### Issue 4: "Backend not reachable"
**Solution:**
1. Ensure backend server is running
2. Check if it's on the correct port (5000)
3. Verify the API base URL in your `.env` file

### Issue 5: "All authentication methods failed"
**Solution:**
1. Check backend JWT secret configuration
2. Verify backend authentication middleware
3. Check if the backend expects a different token format

## Backend Configuration Check

### JWT Secret
Ensure your backend has a proper JWT secret configured:
```javascript
// In your backend auth configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
```

### Authentication Middleware
Check if your backend auth middleware is properly configured:
```javascript
// Example auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ message: 'Please authenticate' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};
```

## Frontend Configuration Check

### Environment Variables
Verify your `.env` file has the correct backend URL:
```env
REACT_APP_API_BASE_URL=http://localhost:5000/v1
```

### Token Storage
Check if tokens are being stored correctly:
```javascript
// In browser console
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
```

## Testing Authentication

### Test 1: Manual Token Test
1. Open browser console
2. Set a test token:
```javascript
localStorage.setItem('token', 'test-token-123');
```
3. Try accessing a protected route
4. Check if you get a 401 or different error

### Test 2: Backend Health Check
1. Open browser console
2. Test backend connectivity:
```javascript
fetch('http://localhost:5000/v1/health')
  .then(response => response.json())
  .then(data => console.log('Backend health:', data))
  .catch(error => console.error('Backend error:', error));
```

### Test 3: Authentication Endpoint Test
1. Try logging in again
2. Check the response for a valid token
3. Verify the token format in browser console

## Debugging Tools

### 1. Auth Debugger Component
- Navigate to `/auth-debugger`
- Use the diagnostic tools to identify issues
- Follow the recommendations provided

### 2. Browser Console
- Check for any JavaScript errors
- Monitor network requests
- Verify token storage

### 3. Backend Logs
- Check backend console for authentication errors
- Verify JWT verification process
- Check if requests are reaching the backend

## Prevention

### 1. Token Management
- Implement automatic token refresh
- Handle token expiration gracefully
- Clear invalid tokens automatically

### 2. Error Handling
- Add proper error handling for 401 responses
- Redirect to login when authentication fails
- Show user-friendly error messages

### 3. Monitoring
- Log authentication attempts
- Monitor token validation
- Track authentication failures

## Getting Help

If you're still experiencing issues:

1. **Check the diagnostic results** from `/auth-debugger`
2. **Review backend logs** for specific error messages
3. **Verify environment configuration** in both frontend and backend
4. **Test with a fresh login** to get a new token
5. **Check network connectivity** between frontend and backend

## Common Backend Issues

### 1. CORS Configuration
Ensure your backend allows requests from your frontend:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### 2. JWT Secret Mismatch
Make sure the JWT secret is consistent across your application:
```javascript
// Use environment variable
const JWT_SECRET = process.env.JWT_SECRET;
```

### 3. Token Format
Verify the token is being sent in the correct format:
```javascript
// Should be: "Bearer <token>"
headers: {
  'Authorization': `Bearer ${token}`
}
```

This troubleshooting guide should help you identify and resolve the authentication issues you're experiencing. 