/**
 * Stripe Testing Card Details
 * 
 * These are official Stripe test card numbers that can be used for testing
 * payment functionality without processing real payments.
 * 
 * IMPORTANT: These cards only work in test mode with valid Stripe test keys.
 */

export interface TestCardDetails {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  description: string;
  expectedResult: 'success' | 'declined' | 'requires_authentication';
  zipCode?: string;
}

export const TEST_CARDS: TestCardDetails[] = [
  // Successful payments
  {
    cardNumber: '4242424242424242',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Visa (successful payment)',
    expectedResult: 'success',
    zipCode: '12345'
  },
  {
    cardNumber: '4000056655665556',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Visa Debit (successful payment)',
    expectedResult: 'success',
    zipCode: '12345'
  },
  {
    cardNumber: '5555555555554444',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Mastercard (successful payment)',
    expectedResult: 'success',
    zipCode: '12345'
  },
  {
    cardNumber: '2223003122003222',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Mastercard 2-series (successful payment)',
    expectedResult: 'success',
    zipCode: '12345'
  },
  {
    cardNumber: '5200828282828210',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Mastercard Debit (successful payment)',
    expectedResult: 'success',
    zipCode: '12345'
  },
  {
    cardNumber: '5105105105105100',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Mastercard (successful payment)',
    expectedResult: 'success',
    zipCode: '12345'
  },
  {
    cardNumber: '378282246310005',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '1234',
    description: 'American Express (successful payment)',
    expectedResult: 'success',
    zipCode: '12345'
  },
  {
    cardNumber: '371449635398431',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '1234',
    description: 'American Express (successful payment)',
    expectedResult: 'success',
    zipCode: '12345'
  },
  {
    cardNumber: '6011111111111117',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Discover (successful payment)',
    expectedResult: 'success',
    zipCode: '12345'
  },
  {
    cardNumber: '3056930009020004',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Diners Club (successful payment)',
    expectedResult: 'success',
    zipCode: '12345'
  },
  {
    cardNumber: '3566002020360505',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'JCB (successful payment)',
    expectedResult: 'success',
    zipCode: '12345'
  },

  // Declined payments
  {
    cardNumber: '4000000000000002',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Visa (declined - card declined)',
    expectedResult: 'declined',
    zipCode: '12345'
  },
  {
    cardNumber: '4000000000009995',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Visa (declined - insufficient funds)',
    expectedResult: 'declined',
    zipCode: '12345'
  },
  {
    cardNumber: '4000000000009987',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Visa (declined - lost card)',
    expectedResult: 'declined',
    zipCode: '12345'
  },
  {
    cardNumber: '4000000000009979',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Visa (declined - stolen card)',
    expectedResult: 'declined',
    zipCode: '12345'
  },
  {
    cardNumber: '4000000000000069',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Visa (declined - expired card)',
    expectedResult: 'declined',
    zipCode: '12345'
  },
  {
    cardNumber: '4000000000000127',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Visa (declined - incorrect CVC)',
    expectedResult: 'declined',
    zipCode: '12345'
  },
  {
    cardNumber: '4000000000000119',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Visa (declined - processing error)',
    expectedResult: 'declined',
    zipCode: '12345'
  },

  // 3D Secure authentication required
  {
    cardNumber: '4000002760003184',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Visa (requires authentication)',
    expectedResult: 'requires_authentication',
    zipCode: '12345'
  },
  {
    cardNumber: '4000002500003155',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Visa (requires authentication - setup future usage)',
    expectedResult: 'requires_authentication',
    zipCode: '12345'
  },
  {
    cardNumber: '4000008400001629',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Visa (requires authentication - declined after authentication)',
    expectedResult: 'requires_authentication',
    zipCode: '12345'
  },
  {
    cardNumber: '4000003800000446',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123',
    description: 'Visa (requires authentication - succeeds after authentication)',
    expectedResult: 'requires_authentication',
    zipCode: '12345'
  }
];

// Helper function to get a random test card
export const getRandomTestCard = (): TestCardDetails => {
  const randomIndex = Math.floor(Math.random() * TEST_CARDS.length);
  return TEST_CARDS[randomIndex];
};

// Helper function to get cards by expected result
export const getTestCardsByResult = (expectedResult: 'success' | 'declined' | 'requires_authentication'): TestCardDetails[] => {
  return TEST_CARDS.filter(card => card.expectedResult === expectedResult);
};

// Helper function to get successful payment cards
export const getSuccessfulCards = (): TestCardDetails[] => {
  return getTestCardsByResult('success');
};

// Helper function to get declined payment cards
export const getDeclinedCards = (): TestCardDetails[] => {
  return getTestCardsByResult('declined');
};

// Helper function to get 3D Secure authentication cards
export const getAuthenticationCards = (): TestCardDetails[] => {
  return getTestCardsByResult('requires_authentication');
};

// Default test card for quick testing
export const DEFAULT_TEST_CARD: TestCardDetails = {
  cardNumber: '4242424242424242',
  expiryMonth: '12',
  expiryYear: '2025',
  cvc: '123',
  description: 'Visa (successful payment) - Default Test Card',
  expectedResult: 'success',
  zipCode: '12345'
};

export default TEST_CARDS; 