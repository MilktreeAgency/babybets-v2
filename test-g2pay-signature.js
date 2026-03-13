// Test G2Pay signature generation to verify it matches PHP's implementation
// Run with: node test-g2pay-signature.js

import crypto from 'crypto';

// PHP-compatible URL encoding to match http_build_query()
function phpRawUrlEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
    .replace(/%20/g, '+'); // Spaces as + for application/x-www-form-urlencoded
}

// Generate signature using G2Pay's method (SHA-512)
function createSignature(data, signatureKey) {
  // Sort keys alphabetically (same as PHP's ksort)
  const keys = Object.keys(data).sort();

  // Build query string to match PHP's http_build_query() encoding EXACTLY
  const pairs = [];
  keys.forEach(key => {
    const value = String(data[key]);
    const encodedKey = phpRawUrlEncode(key);
    const encodedValue = phpRawUrlEncode(value);
    pairs.push(`${encodedKey}=${encodedValue}`);
  });

  let signatureString = pairs.join('&');

  // Normalise all line endings (CRNL|NLCR|NL|CR) to just NL (%0A)
  signatureString = signatureString
    .replace(/%0D%0A/g, '%0A')
    .replace(/%0A%0D/g, '%0A')
    .replace(/%0D/g, '%0A');

  const messageToHash = signatureString + signatureKey;

  // Create SHA-512 hash
  const hash = crypto.createHash('sha512');
  hash.update(messageToHash);
  return hash.digest('hex');
}

// Test with the PHP example from G2Pay documentation
console.log('=== Testing G2Pay Signature Generation ===\n');

const testData = {
  merchantID: '100001',
  action: 'SALE',
  type: 1,
  countryCode: 826,
  currencyCode: 826,
  amount: 1001,
  cardNumber: '4012001037141112',
  cardExpiryMonth: 12,
  cardExpiryYear: 15,
  cardCVV: '083',
  customerName: 'Test Customer',
  customerEmail: 'test@testcustomer.com',
  customerPhone: '+44 (0) 123 45 67 890',
  customerAddress: '16 Test Street',
  customerPostCode: 'TE15 5ST',
  orderRef: 'Test purchase',
  transactionUnique: 'test123'
};

const signatureKey = 'Circle4Take40Idea';

console.log('Test Data:', JSON.stringify(testData, null, 2));
console.log('\nSignature Key:', signatureKey);

// Generate signature
const signature = createSignature(testData, signatureKey);

console.log('\n--- Result ---');
console.log('Generated Signature:', signature);
console.log('\nExpected format: 64 characters (SHA-512 hex)');
console.log('Signature length:', signature.length);

// Test with simplified data (no special characters)
console.log('\n\n=== Testing Simple Payment (No Special Characters) ===\n');

const simpleData = {
  merchantID: '283797',
  action: 'SALE',
  type: 1,
  countryCode: 826,
  currencyCode: 826,
  amount: 300,
  cardNumber: '5599081234568256',
  cardExpiryMonth: '02',
  cardExpiryYear: '30',
  cardCVV: '123',
  customerName: 'John Smith',
  customerEmail: 'test@example.com',
  customerPhone: '07808516998',
  orderRef: 'test-order-123'
};

const realSignatureKey = 'osTJIRRk7Kxxt'; // Your actual key

console.log('Simple Data:', JSON.stringify(simpleData, null, 2));
console.log('\nSignature Key:', realSignatureKey);

const simpleSignature = createSignature(simpleData, realSignatureKey);

console.log('\n--- Result ---');
console.log('Generated Signature:', simpleSignature);
console.log('Signature length:', simpleSignature.length);

console.log('\n✅ Signature test completed!');
console.log('\nNote: These signatures should match what G2Pay expects.');
console.log('If payment fails with "signature mismatch", the algorithm needs adjustment.');
