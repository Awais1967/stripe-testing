# Login Troubleshooting Guide

## Current Issue
You're experiencing login problems. This guide will help you identify and fix login-specific issues.

## Quick Diagnostic Steps

### 1. Use the Login Debugger
1. Navigate to `/login-debugger` in your app
2. Click "Run Login Tests" to automatically diagnose issues
3. Review the test results to identify the specific problem

### 2. Check Backend Status
1. Ensure your backend server is running on port 5000
2. Test backend connectivity: `http://localhost:5000/v1/health`
3. Check backend console for any error messages

### 3. Verify Environment Configuration
Check your `.env` file has the correct backend URL:
```env
REACT_APP_API_BASE_URL=http://localhost:5000/v1
```

## Common Login Issues & Solutions

### Issue 1: "Backend not reachable"
**Symptoms:**
- Login tests show "Backend Connectivity: ❌ Failed"
- Network errors in browser console

**Solutions:**
1. **Start the backend server:**
   ```bash
   cd 1v1-Squats-game-backend
   npm start
   ```

2. **Check if backend is on correct port:**
   - Default should be port 5000
   - Check backend logs for port information

3. **Test backend directly:**
   ```javascript
   // In browser console
   fetch('http://localhost:5000/v1/health')
     .then(r => r.json())
     .then(console.log)
     .catch(console.error)
   ```

### Issue 2: "Login endpoint not found"
**Symptoms:**
- 404 errors when trying to login
- "Login endpoint not accessible" in tests

**Solutions:**
1. **Check backend routes:**
   - Ensure `/auth/login` route exists in backend
   - Check backend route configuration

2. **Verify API URL:**
   - Make sure `.env` has correct `REACT_APP_API_BASE_URL`
   - Should be: `http://localhost:5000/v1`

### Issue 3: "Invalid credentials"
**Symptoms:**
- Login fails with 401/400 errors
- "Invalid email or password" messages

**Solutions:**
1. **Register a new account first:**
   - Go to `/register`
   - Create a new account with valid email/password
   - Try logging in with those credentials

2. **Use test credentials:**
   - Email: `test@example.com`
   - Password: `password123`

3. **Check backend user database:**
   - Ensure users are being saved correctly
   - Check password hashing implementation

### Issue 4: "CORS errors"
**Symptoms:**
- Browser console shows CORS errors
- Network requests blocked

**Solutions:**
1. **Check backend CORS configuration:**
   ```javascript
   // In backend
   app.use(cors({
     origin: 'http://localhost:3000',
     credentials: true
   }));
   ```

2. **Restart both frontend and backend servers**

### Issue 5: "Token not generated"
**Symptoms:**
- Login appears successful but no token stored
- "Stored Auth Data: ❌ Failed" in tests

**Solutions:**
1. **Check backend JWT configuration:**
   ```javascript
   // Ensure JWT secret is set
   const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
   ```

2. **Verify login response format:**
   ```javascript
   // Expected response format
   {
     user: { _id: '...', name: '...', email: '...' },
     token: 'jwt-token-here'
   }
   ```

## Manual Testing Steps

### Step 1: Test Backend Health
```javascript
// In browser console
fetch('http://localhost:5000/v1/health')
  .then(response => {
    console.log('Status:', response.status);
    return response.json();
  })
  .then(data => console.log('Health data:', data))
  .catch(error => console.error('Backend error:', error));
```

### Step 2: Test Login API Directly
```javascript
// In browser console
fetch('http://localhost:5000/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
})
.then(response => {
  console.log('Login status:', response.status);
  return response.json();
})
.then(data => console.log('Login response:', data))
.catch(error => console.error('Login error:', error));
```

### Step 3: Check Stored Data
```javascript
// In browser console
console.log('Stored token:', localStorage.getItem('token'));
console.log('Stored user:', localStorage.getItem('user'));
```

## Debugging Tools

### 1. Login Debugger Component
- Navigate to `/login-debugger`
- Run automated tests
- Get detailed error information
- Test different scenarios

### 2. Browser Developer Tools
- **Network tab:** Monitor API requests
- **Console tab:** Check for JavaScript errors
- **Application tab:** Verify localStorage data

### 3. Backend Logs
- Check backend console for error messages
- Look for authentication-related logs
- Verify request/response flow

## Prevention Tips

### 1. Always Test Backend First
Before testing frontend login, ensure backend is working:
```bash
# Test backend health
curl http://localhost:5000/v1/health
```

### 2. Use Consistent Test Data
Create a test account and use it consistently:
```javascript
// Test credentials
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};
```

### 3. Monitor Network Requests
Always check browser Network tab to see:
- Request URLs
- Request headers
- Response status codes
- Response data

## Getting Help

If you're still experiencing login issues:

1. **Run the Login Debugger** (`/login-debugger`)
2. **Check backend logs** for specific error messages
3. **Verify environment variables** in both frontend and backend
4. **Test with a fresh account** (register new user)
5. **Check network connectivity** between frontend and backend

## Common Backend Issues

### 1. Missing Dependencies
```bash
# In backend directory
npm install jsonwebtoken bcryptjs cors
```

### 2. Environment Variables
```bash
# In backend .env file
JWT_SECRET=your-secret-key-here
PORT=5000
```

### 3. Route Configuration
```javascript
// Ensure login route is properly configured
app.post('/auth/login', loginController);
```

This troubleshooting guide should help you identify and resolve the specific login issue you're experiencing. 