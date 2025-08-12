import React, { useState } from 'react';
import { 
  TEST_CARDS, 
  getSuccessfulCards, 
  getDeclinedCards, 
  getAuthenticationCards,
  DEFAULT_TEST_CARD,
  TestCardDetails 
} from '../utils/testingCardDetails';

const TestingCardDetails: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'success' | 'declined' | 'authentication'>('all');
  const [selectedCard, setSelectedCard] = useState<TestCardDetails | null>(null);

  const getCardsByCategory = () => {
    switch (selectedCategory) {
      case 'success':
        return getSuccessfulCards();
      case 'declined':
        return getDeclinedCards();
      case 'authentication':
        return getAuthenticationCards();
      default:
        return TEST_CARDS;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
    console.log('Copied to clipboard:', text);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'success':
        return '#10b981'; // green
      case 'declined':
        return '#ef4444'; // red
      case 'requires_authentication':
        return '#f59e0b'; // yellow
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <div className="testing-cards-container">
      <div className="testing-cards-header">
        <h2>🧪 Stripe Testing Card Details</h2>
        <p className="testing-cards-description">
          Use these official Stripe test card numbers for testing payment functionality. 
          These cards only work in test mode with valid Stripe test keys.
        </p>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        <button
          className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All Cards ({TEST_CARDS.length})
        </button>
        <button
          className={`filter-btn ${selectedCategory === 'success' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('success')}
        >
          Successful ({getSuccessfulCards().length})
        </button>
        <button
          className={`filter-btn ${selectedCategory === 'declined' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('declined')}
        >
          Declined ({getDeclinedCards().length})
        </button>
        <button
          className={`filter-btn ${selectedCategory === 'authentication' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('authentication')}
        >
          3D Secure ({getAuthenticationCards().length})
        </button>
      </div>

      {/* Default Test Card */}
      <div className="default-card-section">
        <h3>🚀 Quick Test Card</h3>
        <div className="default-card">
          <div className="card-info">
            <div className="card-number">
              <span>Card Number:</span>
              <code>{DEFAULT_TEST_CARD.cardNumber}</code>
              <button 
                className="copy-btn"
                onClick={() => copyToClipboard(DEFAULT_TEST_CARD.cardNumber)}
                title="Copy card number"
              >
                📋
              </button>
            </div>
            <div className="card-details">
              <div>
                <span>Expiry:</span>
                <code>{DEFAULT_TEST_CARD.expiryMonth}/{DEFAULT_TEST_CARD.expiryYear}</code>
              </div>
              <div>
                <span>CVC:</span>
                <code>{DEFAULT_TEST_CARD.cvc}</code>
              </div>
              <div>
                <span>ZIP:</span>
                <code>{DEFAULT_TEST_CARD.zipCode}</code>
              </div>
            </div>
            <div className="card-description">
              {DEFAULT_TEST_CARD.description}
            </div>
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div className="cards-list">
        <h3>📋 All Test Cards</h3>
        <div className="cards-grid">
          {getCardsByCategory().map((card, index) => (
            <div 
              key={index} 
              className="card-item"
              onClick={() => setSelectedCard(card)}
            >
              <div className="card-header">
                <span 
                  className="result-badge"
                  style={{ backgroundColor: getCategoryColor(card.expectedResult) }}
                >
                  {card.expectedResult}
                </span>
              </div>
              <div className="card-content">
                <div className="card-number-display">
                  {card.cardNumber.replace(/(\d{4})/g, '$1 ').trim()}
                </div>
                <div className="card-meta">
                  <span>Exp: {card.expiryMonth}/{card.expiryYear}</span>
                  <span>CVC: {card.cvc}</span>
                </div>
                <div className="card-description">
                  {card.description}
                </div>
              </div>
              <div className="card-actions">
                <button 
                  className="copy-card-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(card.cardNumber);
                  }}
                  title="Copy card number"
                >
                  📋 Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Card Modal */}
      {selectedCard && (
        <div className="card-modal-overlay" onClick={() => setSelectedCard(null)}>
          <div className="card-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Card Details</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedCard(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="card-detail-item">
                <label>Card Number:</label>
                <div className="detail-value">
                  <code>{selectedCard.cardNumber}</code>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(selectedCard.cardNumber)}
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="card-detail-item">
                <label>Expiry Date:</label>
                <div className="detail-value">
                  <code>{selectedCard.expiryMonth}/{selectedCard.expiryYear}</code>
                </div>
              </div>
              <div className="card-detail-item">
                <label>CVC:</label>
                <div className="detail-value">
                  <code>{selectedCard.cvc}</code>
                </div>
              </div>
              <div className="card-detail-item">
                <label>ZIP Code:</label>
                <div className="detail-value">
                  <code>{selectedCard.zipCode}</code>
                </div>
              </div>
              <div className="card-detail-item">
                <label>Description:</label>
                <div className="detail-value">
                  {selectedCard.description}
                </div>
              </div>
              <div className="card-detail-item">
                <label>Expected Result:</label>
                <div className="detail-value">
                  <span 
                    className="result-badge"
                    style={{ backgroundColor: getCategoryColor(selectedCard.expectedResult) }}
                  >
                    {selectedCard.expectedResult}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Important Notes */}
      <div className="important-notes">
        <h3>⚠️ Important Notes</h3>
        <ul>
          <li>These cards only work with Stripe test keys (pk_test_*)</li>
          <li>Never use these cards with live Stripe keys</li>
          <li>All amounts are in cents (e.g., $10.00 = 1000)</li>
          <li>3D Secure cards require additional authentication steps</li>
          <li>Test cards work in any future expiry date</li>
        </ul>
      </div>
    </div>
  );
};

export default TestingCardDetails; 