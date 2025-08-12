# Stripe Setup Guide

## Current Issue
You're getting the error: `"Invalid API Key provided: pk_test_****************_key"`

This means you're using a placeholder Stripe API key that needs to be replaced with a real test key.

## How to Fix

### 1. Get Your Stripe Test Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up or log in to your Stripe account
3. Navigate to **Developers** → **API keys**
4. Copy your **Publishable key** (starts with `pk_test_`)

### 2. Update Environment Variables

Create or update your `.env` file in the project root:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/v1
REACT_APP_APP_URL=http://localhost:3000
REACT_APP_WS_URL=ws://localhost:3000
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
```

Replace `pk_test_your_actual_key_here` with your actual Stripe test publishable key.

### 3. Restart the Development Server

After updating the `.env` file:

```bash
npm start
```

## Testing Card Details

Once you have valid Stripe keys, you can use these test cards:

### Quick Test Card (Recommended)
- **Card Number:** `4242424242424242`
- **Expiry:** `12/2025`
- **CVC:** `123`
- **ZIP:** `12345`
- **Result:** Successful payment

### Other Test Cards

#### Successful Payments
- `4000056655665556` - Visa Debit
- `5555555555554444` - Mastercard
- `378282246310005` - American Express
- `6011111111111117` - Discover

#### Declined Payments
- `4000000000000002` - Card declined
- `4000000000009995` - Insufficient funds
- `4000000000009987` - Lost card
- `4000000000009979` - Stolen card

#### 3D Secure Authentication
- `4000002760003184` - Requires authentication
- `4000002500003155` - Setup future usage
- `4000008400001629` - Declined after authentication

## Important Notes

1. **Test Mode Only:** These cards only work with Stripe test keys (`pk_test_*`)
2. **Never Use in Production:** Don't use test cards with live Stripe keys
3. **Amounts in Cents:** Stripe expects amounts in cents (e.g., $10.00 = 1000)
4. **Future Expiry Dates:** Test cards work with any future expiry date
5. **No Real Charges:** These cards never result in real charges

## Accessing Test Cards in the App

1. Navigate to `/testing-cards` in your app
2. Or click "🧪 Testing Card Details" from the User Settings page
3. Browse and copy test card details as needed

## Troubleshooting

### If you still get API key errors:
1. Check that your `.env` file is in the project root
2. Verify the environment variable name is exactly `REACT_APP_STRIPE_PUBLISHABLE_KEY`
3. Restart the development server after changing `.env`
4. Check browser console for any other errors

### If payments fail:
1. Ensure you're using test cards (not real card numbers)
2. Check that your backend is properly configured
3. Verify the payment amount is in cents
3. Check browser console for detailed error messages

## Security Best Practices

1. **Never commit API keys to version control**
2. **Use environment variables for all sensitive data**
3. **Keep test and live keys separate**
4. **Regularly rotate your API keys**
5. **Monitor your Stripe dashboard for any issues**

## Getting Help

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Stripe Support](https://support.stripe.com/) 