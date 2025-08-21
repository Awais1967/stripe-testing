import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/apiService';

// Load Stripe.js
declare global {
  interface Window {
    Stripe: any;
  }
}

interface TopUpData {
  amount: number;
  currency: string;
}

interface PaymentIntent {
  userId: string;
  amount: number;
  currency: string;
  clientSecret: string;
  paymentIntentId: string;
}

interface StripeElements {
  card: any;
  mount: (element: HTMLElement) => void;
  unmount: () => void;
}

interface StripeState {
  stripe: any;
  elements: any;
  cardElement: any;
}

const TopUp: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [topUpData, setTopUpData] = useState<TopUpData>({
    amount: 10,
    currency: 'usd'
  });
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [stripeState, setStripeState] = useState<StripeState | null>(null);
  const cardElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('TopUp: Loaded user data:', parsedUser);
        console.log('TopUp: User ID from localStorage:', parsedUser._id || parsedUser.id);
        
        // Ensure user has _id field
        if (!parsedUser._id && parsedUser.id) {
          parsedUser._id = parsedUser.id;
          console.log('TopUp: Fixed user ID format');
        }
        
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setError('Invalid user data');
      }
    } else {
      setError('No user data found. Please login first.');
    }

    // Load Stripe.js
    loadStripe();
  }, []);

  const loadStripe = async () => {
    try {
      // Load Stripe.js script if not already loaded
      if (!window.Stripe) {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = () => {
          initializeStripe();
        };
        document.head.appendChild(script);
      } else {
        initializeStripe();
      }
    } catch (error) {
      console.error('Failed to load Stripe:', error);
      setError('Failed to load payment system');
    }
  };

  const initializeStripe = () => {
    try {
      const stripeInstance = window.Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RwHymPxgJrEvxYCAtWfJ1nu9KKGhdPKuQJ7wFIOi6EgHweZPLTX5avOiQ4QztoPyC0WhPFdbqRapalcSVUMSVr400y5Rhg2Lg');
      const elementsInstance = stripeInstance.elements();
      
      // Create card element
      const cardElement = elementsInstance.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
              color: '#aab7c4',
            },
          },
          invalid: {
            color: '#9e2146',
          },
        },
      });
      
      // Store all Stripe components in state
      setStripeState({
        stripe: stripeInstance,
        elements: elementsInstance,
        cardElement: cardElement
      });
      
      // Mount card element when component mounts
      if (cardElementRef.current) {
        cardElement.mount(cardElementRef.current);
      }
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      setError('Failed to initialize payment system');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTopUpData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !stripeState) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Processing payment for user:', user._id);
      console.log('Payment data:', topUpData);

      // Validate user ID
      if (!user._id || user._id.trim() === '') {
        throw new Error('Invalid user ID. User ID is missing or empty.');
      }

      // Create payment intent
      const response = await ApiService.initiateTopup({
        userId: user._id,
        amount: topUpData.amount,
        currency: topUpData.currency
      });

      console.log('Payment intent response:', response);
      setPaymentIntent(response);

      // Use the reliable confirmCardPayment method with card element
      const { error, paymentIntent: confirmedPaymentIntent } = await stripeState.stripe.confirmCardPayment(
        response.clientSecret,
        {
          payment_method: {
            card: stripeState.cardElement,
            billing_details: {
              name: user.name || '',
              email: user.email || ''
            }
          }
        }
      );

      if (error) {
        console.error('Payment failed:', error);
        setError(`Payment failed: ${error.message}`);
      } else {
        console.log('Payment succeeded:', confirmedPaymentIntent);
        
        // Payment succeeded - webhook will handle balance update automatically
        setSuccess(`Payment completed! Amount $${topUpData.amount} will be added to your wallet shortly.`);
        
        // Clear payment intent
        setPaymentIntent(null);
        
        // Redirect to wallet to show updated balance
        setTimeout(() => {
          navigate('/wallet');
        }, 3000); // Give webhook time to process
      }
    } catch (err: any) {
      console.error('Payment processing failed:', err);
      setError(err.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDismissError = () => setError('');
  const handleDismissSuccess = () => setSuccess('');

  if (!user) {
    return <div className="loading">Loading user data...</div>;
  }

  return (
    <div className="topup-container">
      <h2>Top Up Your Wallet</h2>
      
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

      <div className="user-info">
        <h3>User Information</h3>
        <div className="info-grid">
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
        </div>
      </div>

      <div className="payment-form">
        <h3>Payment Details</h3>
        <form onSubmit={handlePaymentSubmit}>
          <div className="form-group">
            <label htmlFor="amount">Amount ($)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={topUpData.amount}
              onChange={handleInputChange}
              min="1"
              step="0.01"
              required
              className="form-input"
              placeholder="Enter amount"
            />
          </div>

          <div className="form-group">
            <label htmlFor="currency">Currency</label>
            <select
              id="currency"
              name="currency"
              value={topUpData.currency}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="usd">USD</option>
              <option value="eur">EUR</option>
              <option value="gbp">GBP</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="card-element">Card Information</label>
            <div 
              id="card-element" 
              ref={cardElementRef}
              className="card-element"
            >
              {/* Stripe Card Element will be mounted here */}
            </div>
          </div>

                     <button 
             type="submit" 
             disabled={loading || !stripeState}
             className="submit-btn"
           >
             {loading ? 'Processing Payment...' : 'Pay Now'}
           </button>
        </form>
      </div>

      {paymentIntent && (
        <div className="payment-status">
          <h3>Payment Processing</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Amount:</label>
              <span>${paymentIntent.amount} {paymentIntent.currency.toUpperCase()}</span>
            </div>
            <div className="info-item">
              <label>Status:</label>
              <span>Processing payment...</span>
            </div>
          </div>
        </div>
      )}

      <div className="actions">
        <button 
          onClick={() => navigate('/user-settings')} 
          className="action-btn secondary"
        >
          Back to Settings
        </button>
        
        <button 
          onClick={() => navigate('/wallet')} 
          className="action-btn secondary"
        >
          Go to Wallet
        </button>
      </div>
    </div>
  );
};

export default TopUp; 