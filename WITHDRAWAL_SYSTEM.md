# Stripe Withdrawal System Documentation

## Overview
This document outlines the complete withdrawal system using Stripe Connect for real money transfers. The system includes user withdrawal requests, admin approval workflows, and actual Stripe transfers.

## Frontend Components

### 1. WithdrawalRequest Component (`/withdrawal-request`)
- **Purpose**: Allows users to request withdrawals from their wallet balance
- **Features**:
  - Display current wallet balance
  - Input withdrawal amount (minimum $10)
  - Currency selection (USD, EUR, GBP)
  - Withdrawal history display
  - Real-time validation

### 2. WithdrawalApproval Component (`/withdrawal-approval`)
- **Purpose**: Admin dashboard for reviewing and processing withdrawal requests
- **Features**:
  - View all pending withdrawal requests
  - Approve or reject requests with reasons
  - View completed/failed requests
  - Real-time status updates

## Required Backend APIs

### 1. Create Withdrawal Request
```http
POST /v1/wallet/withdrawal/request
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "userId": "string",
  "amount": number,
  "currency": "string"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "withdrawal_request_id",
    "userId": "user_id",
    "amount": 100.00,
    "currency": "usd",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Get User's Withdrawal Requests
```http
GET /v1/wallet/withdrawal/requests/:userId
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "withdrawal_request_id",
      "userId": "user_id",
      "amount": 100.00,
      "currency": "usd",
      "status": "pending|approved|rejected|completed|failed",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "stripeTransferId": "tr_xxx",
      "reason": "string"
    }
  ]
}
```

### 3. Get All Withdrawal Requests (Admin)
```http
GET /v1/wallet/withdrawal/requests
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "withdrawal_request_id",
      "userId": "user_id",
      "userEmail": "user@example.com",
      "userName": "John Doe",
      "amount": 100.00,
      "currency": "usd",
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "stripeTransferId": "tr_xxx",
      "reason": "string",
      "stripeAccountId": "acct_xxx"
    }
  ]
}
```

### 4. Process Withdrawal Request (Approve/Reject)
```http
POST /v1/wallet/withdrawal/process
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "requestId": "withdrawal_request_id",
  "action": "approve|reject",
  "reason": "string (optional)"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "withdrawal_request_id",
    "status": "approved|rejected",
    "stripeTransferId": "tr_xxx",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. Get Withdrawal Request by ID
```http
GET /v1/wallet/withdrawal/request/:requestId
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "withdrawal_request_id",
    "userId": "user_id",
    "userEmail": "user@example.com",
    "userName": "John Doe",
    "amount": 100.00,
    "currency": "usd",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "stripeTransferId": "tr_xxx",
    "reason": "string",
    "stripeAccountId": "acct_xxx"
  }
}
```

## Backend Implementation Requirements

### Database Schema

#### WithdrawalRequest Model
```javascript
{
  id: String, // MongoDB ObjectId
  userId: String, // Reference to User
  amount: Number, // Amount in cents
  currency: String, // 'usd', 'eur', 'gbp'
  status: String, // 'pending', 'approved', 'rejected', 'completed', 'failed'
  createdAt: Date,
  updatedAt: Date,
  stripeTransferId: String, // Stripe transfer ID
  reason: String, // Admin reason for approval/rejection
  stripeAccountId: String // User's Stripe Connect account ID
}
```

### Stripe Integration

#### 1. Create Transfer (When Approving)
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create transfer to user's connected account
const transfer = await stripe.transfers.create({
  amount: request.amount, // Amount in cents
  currency: request.currency,
  destination: request.stripeAccountId, // User's connected account
  description: `Withdrawal for ${request.userName}`,
  metadata: {
    withdrawal_request_id: request.id,
    user_id: request.userId
  }
});
```

#### 2. Webhook Handling
```javascript
// Handle transfer.succeeded webhook
app.post('/webhook/transfer-succeeded', async (req, res) => {
  const event = req.body;
  
  if (event.type === 'transfer.succeeded') {
    const transfer = event.data.object;
    
    // Update withdrawal request status
    await WithdrawalRequest.findByIdAndUpdate(
      transfer.metadata.withdrawal_request_id,
      {
        status: 'completed',
        stripeTransferId: transfer.id,
        updatedAt: new Date()
      }
    );
    
    // Update user's wallet balance
    await Wallet.findOneAndUpdate(
      { userId: transfer.metadata.user_id },
      { $inc: { balance: -transfer.amount / 100 } }
    );
  }
  
  res.json({ received: true });
});
```

### Validation Rules

1. **Minimum Withdrawal**: $10 USD
2. **Maximum Withdrawal**: User's current wallet balance
3. **Currency Support**: USD, EUR, GBP
4. **User Requirements**: Must have completed Stripe Connect onboarding
5. **Balance Check**: Ensure sufficient funds before approval

### Error Handling

#### Common Error Responses
```json
{
  "status": "error",
  "message": "Insufficient balance for withdrawal",
  "code": "INSUFFICIENT_BALANCE"
}
```

```json
{
  "status": "error", 
  "message": "User has not completed Stripe onboarding",
  "code": "ONBOARDING_INCOMPLETE"
}
```

```json
{
  "status": "error",
  "message": "Minimum withdrawal amount is $10",
  "code": "MINIMUM_AMOUNT"
}
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Admin endpoints require admin privileges
3. **Rate Limiting**: Implement rate limiting on withdrawal requests
4. **Audit Logging**: Log all withdrawal activities
5. **Fraud Prevention**: Implement additional verification for large amounts

## Testing

### Test Cards for Stripe Connect
- **Test Account**: Use Stripe Connect test accounts
- **Test Transfers**: Use test mode for all transfers
- **Webhook Testing**: Use Stripe CLI for local webhook testing

### Test Scenarios
1. User creates withdrawal request
2. Admin approves request
3. Stripe transfer is created
4. Webhook updates status to completed
5. User balance is updated

## Deployment Checklist

1. **Environment Variables**:
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET`: Webhook endpoint secret
   - `STRIPE_CONNECT_CLIENT_ID`: Your Connect application ID

2. **Database Setup**:
   - Create WithdrawalRequest collection
   - Add indexes for userId, status, createdAt

3. **Webhook Configuration**:
   - Configure transfer.succeeded webhook
   - Set up webhook endpoint in Stripe Dashboard

4. **Monitoring**:
   - Set up alerts for failed transfers
   - Monitor withdrawal request volumes
   - Track approval/rejection rates

## API Integration Example

### Frontend Usage
```javascript
import { WithdrawalApiService } from '../services/withdrawalApiService';

// Create withdrawal request
const request = await WithdrawalApiService.createWithdrawalRequest({
  userId: 'user_id',
  amount: 100.00,
  currency: 'usd'
});

// Get user's withdrawal requests
const requests = await WithdrawalApiService.getWithdrawalRequests('user_id');

// Admin: Process withdrawal request
const result = await WithdrawalApiService.processWithdrawalRequest({
  requestId: 'request_id',
  action: 'approve',
  reason: 'Approved after verification'
});
```

This withdrawal system provides a complete solution for real money transfers using Stripe Connect, with proper approval workflows and security measures.

