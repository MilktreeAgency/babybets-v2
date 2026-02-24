# Google Pay Setup Guide

This guide explains how to set up Google Pay for your BabyBets application.

## Overview

Google Pay requires a **Google Merchant ID** from the Google Pay Business Console. This is separate from your G2Pay merchant credentials.

## What You Need

| Secret | Where to Set | Purpose |
|--------|--------------|---------|
| **VITE_GOOGLE_MERCHANT_ID** | Vercel (Frontend) | Google Pay Business Console merchant ID |
| **VITE_GOOGLE_PAY_MERCHANT_NAME** | Vercel (Frontend) | Merchant name shown in Google Pay |
| **VITE_GOOGLE_PAY_GATEWAY** | Vercel (Frontend) | Gateway identifier (crst for Cardstream/G2Pay) |
| **VITE_GOOGLE_PAY_GATEWAY_MERCHANT_ID** | Vercel (Frontend) | G2Pay merchant ID for gateway |
| **VITE_G2PAY_MERCHANT_ID** | Vercel (Frontend) | Payment gateway merchant ID (already have) |
| **G2PAY_MERCHANT_ID** | Supabase (Backend) | Same as above, for edge functions (already have) |
| **G2PAY_SIGNATURE_KEY** | Supabase (Backend) | Payment gateway signature key (already have) |

## Step-by-Step Setup

### 1. Register with Google Pay Business Console

1. **Go to Google Pay Business Console**
   - URL: https://pay.google.com/business/console/
   - Sign in with your Google Business account

2. **Create a Merchant Profile**
   - Click "Get Started" or "Create Profile"
   - Fill in your business information:
     - Business name: BabyBets
     - Business address
     - Business category: E-commerce / Retail
   - Submit for review

3. **Verify Your Business**
   - Google will send a verification code
   - Enter the code to verify your business
   - This may take a few days

### 2. Configure Payment Gateway Integration

1. **Go to Integration Settings**
   - In Google Pay Business Console
   - Navigate to "Integrations" or "Payment Gateway"

2. **Select Gateway Integration Type**
   - Choose: **"Gateway"** (not "Direct")
   - Gateway Provider: **Cardstream**
   - (G2Pay uses Cardstream as their gateway)

3. **Enter Gateway Information**
   - Gateway Merchant ID: Your G2Pay Merchant ID (e.g., `283797`)
   - Gateway Name: `crst` (Cardstream identifier)
   - You may need to provide proof of your G2Pay account

### 3. Get Your Google Merchant ID

1. **Once Approved**
   - After Google approves your integration
   - You'll see your Google Merchant ID

2. **Copy Merchant ID**
   - Format: Usually starts with `BCR2DN4T`
   - Example: `BCR2DN4T7KNNPQQB`
   - This is your unique Google Pay merchant identifier

3. **Test Merchant ID (Development)**
   - For testing, you can use: `BCR2DN4T7KNNPQQB`
   - Production: Use your actual merchant ID from Google

### 4. Add to Your Environment Variables

#### For Vercel (Frontend):
1. Go to your Vercel project
2. Settings > Environment Variables
3. Add all Google Pay variables:
   ```
   VITE_GOOGLE_MERCHANT_ID=BCR2DN4T7KNNPQQB
   VITE_GOOGLE_PAY_MERCHANT_NAME=BabyBets
   VITE_GOOGLE_PAY_GATEWAY=crst
   VITE_GOOGLE_PAY_GATEWAY_MERCHANT_ID=283797
   ```
4. Redeploy your application

#### For Local Development:
1. Add to your `.env` file:
   ```bash
   VITE_GOOGLE_MERCHANT_ID=BCR2DN4T7KNNPQQB
   VITE_GOOGLE_PAY_MERCHANT_NAME=BabyBets
   VITE_GOOGLE_PAY_GATEWAY=crst
   VITE_GOOGLE_PAY_GATEWAY_MERCHANT_ID=283797
   ```

### 5. Verify Google Pay Works

1. **Test on Supported Device**
   - Google Pay works on:
     - Chrome browser (desktop and mobile)
     - Android devices with Google Pay app
     - Some other browsers with Google Pay support

2. **Test Payment Flow**
   - Add items to cart
   - Go to checkout
   - Click "Google Pay" button
   - Complete test payment

3. **Check for Errors**
   - Open browser console (F12)
   - Look for `[Google Pay]` logs
   - Verify no errors appear

## Google Pay Configuration in Code

Your application configures Google Pay like this:

```typescript
const paymentDataRequest = {
  apiVersion: 2,
  apiVersionMinor: 0,
  merchantInfo: {
    merchantName: import.meta.env.VITE_GOOGLE_PAY_MERCHANT_NAME, // Your business name
    merchantId: import.meta.env.VITE_GOOGLE_MERCHANT_ID, // Google merchant ID
  },
  allowedPaymentMethods: [
    {
      type: 'CARD',
      parameters: {
        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
        allowedCardNetworks: ['VISA', 'MASTERCARD'],
      },
      tokenizationSpecification: {
        type: 'PAYMENT_GATEWAY',
        parameters: {
          gateway: import.meta.env.VITE_GOOGLE_PAY_GATEWAY, // Gateway identifier (crst)
          gatewayMerchantId: import.meta.env.VITE_GOOGLE_PAY_GATEWAY_MERCHANT_ID, // G2Pay merchant ID
        },
      },
    },
  ],
  // ... transaction info
}
```

### Environment Variables Explained

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_GOOGLE_MERCHANT_ID` | `BCR2DN4T7KNNPQQB` | Your Google Pay merchant ID from Business Console |
| `VITE_GOOGLE_PAY_MERCHANT_NAME` | `BabyBets` | Business name shown in Google Pay payment sheet |
| `VITE_GOOGLE_PAY_GATEWAY` | `crst` | Gateway identifier for Cardstream (G2Pay's gateway) |
| `VITE_GOOGLE_PAY_GATEWAY_MERCHANT_ID` | `283797` | Your G2Pay merchant ID (same as VITE_G2PAY_MERCHANT_ID) |

**Security Note:** All sensitive credentials must be set as environment variables. There are no fallback values - if a variable is missing, Google Pay will fail to initialize, alerting you to the misconfiguration.

## Differences Between Apple Pay and Google Pay

| Feature | Apple Pay | Google Pay |
|---------|-----------|------------|
| **Merchant Registration** | ✅ Required (Apple Developer) | ✅ Required (Google Business Console) |
| **Merchant Identifier** | APPLE_PAY_MERCHANT_ID | VITE_GOOGLE_MERCHANT_ID |
| **Domain Verification** | ✅ Required | ❌ Not required |
| **Validation Endpoint** | ✅ Required | ❌ Not required |
| **Backend Secrets** | 3 extra secrets | 0 extra secrets |
| **Environment Variable** | Frontend only | Frontend only |
| **Supported Platforms** | iOS, macOS, Safari | Android, Chrome, many browsers |

## Common Issues and Solutions

### Issue: "Google Pay is not available"
**Solution:**
- Check that you're using a supported browser (Chrome recommended)
- Ensure `VITE_GOOGLE_MERCHANT_ID` is set in Vercel
- Verify merchant ID format (should start with `BCR2DN4T`)
- Check browser console for specific errors

### Issue: "Payment failed with merchant validation error"
**Solution:**
- Verify your Google Merchant ID is correct
- Ensure your business is verified in Google Pay Business Console
- Check that gateway configuration is set to "Cardstream"
- Verify `VITE_G2PAY_MERCHANT_ID` matches your actual G2Pay merchant ID

### Issue: "tokenizationSpecification error"
**Solution:**
- Verify gateway is set to `crst` (Cardstream)
- Ensure gatewayMerchantId is your G2Pay merchant ID
- Check that G2Pay supports Google Pay (contact G2Pay support)

### Issue: Google Pay button doesn't show
**Solution:**
- Check browser console for `[Google Pay]` initialization logs
- Verify Google Pay script loaded: `window.google?.payments?.api`
- Try in incognito/private browsing mode
- Check network tab for blocked requests

## Testing Google Pay

### Test Cards

Use Google's test cards in TEST environment:
- **Visa**: 4111 1111 1111 1111
- **Mastercard**: 5555 5555 5555 4444
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### Production Testing

For production, use real cards:
1. Add a real card to Google Pay on your device
2. Test with small amounts first
3. Verify payment appears in G2Pay dashboard
4. Check order completion in your database

## Security Considerations

1. **Merchant ID is Public**
   - `VITE_GOOGLE_MERCHANT_ID` is safe to expose in frontend
   - It's used for Google Pay merchant verification only
   - Similar to Apple Pay merchant ID

2. **Gateway Credentials**
   - `G2PAY_SIGNATURE_KEY` must stay secret (backend only)
   - Never expose signature key to frontend

3. **Payment Tokens**
   - Google Pay creates encrypted payment tokens
   - Tokens are sent to G2Pay for processing
   - No card data is stored in your application

## Need Help?

### Google Pay Support
- Documentation: https://developers.google.com/pay/api/web
- Business Console: https://pay.google.com/business/console/
- Support: https://support.google.com/pay/business/

### G2Pay Support
Contact G2Pay to:
- Verify Google Pay is enabled for your account
- Confirm gateway configuration
- Troubleshoot payment processing issues

## Summary

**What you need to do:**

1. ✅ Register with Google Pay Business Console
2. ✅ Get Google Merchant ID (format: `BCR2DN4TXXXXXXX`)
3. ✅ Add `VITE_GOOGLE_MERCHANT_ID` to Vercel environment variables
4. ✅ Add `VITE_GOOGLE_MERCHANT_ID` to your `.env` file
5. ✅ Redeploy your Vercel application
6. ✅ Test Google Pay on your production site

**You already have** (no changes needed):
- ✅ G2Pay merchant ID
- ✅ G2Pay signature key
- ✅ Payment gateway configuration
- ✅ Google Pay payment processing function

Your Google Pay integration is mostly ready - you just need to add the Google Merchant ID!
