# Security Improvements - No Fallback Values

## What Changed

We removed all hardcoded fallback values for sensitive credentials to improve security. If an environment variable is missing, the application will now fail instead of using insecure default values.

## Security Issue (Before)

**Previously**, the code had fallback values:

```typescript
// ❌ BAD: Hardcoded fallback values
merchantId: import.meta.env.VITE_GOOGLE_MERCHANT_ID || 'BCR2DN4T7KNNPQQB',
gatewayMerchantId: import.meta.env.VITE_G2PAY_MERCHANT_ID || '285598',
gateway: 'crst', // Hardcoded
merchantName: 'BabyBets', // Hardcoded
```

**Problem**: If environment variables were missing or misconfigured, the application would use these default values, which could:
- Use wrong merchant credentials
- Process payments with incorrect configuration
- Fail silently without alerting developers

## Security Fix (After)

**Now**, all values must come from environment variables:

```typescript
// ✅ GOOD: No fallbacks - will fail if env var missing
merchantId: import.meta.env.VITE_GOOGLE_MERCHANT_ID,
gatewayMerchantId: import.meta.env.VITE_GOOGLE_PAY_GATEWAY_MERCHANT_ID,
gateway: import.meta.env.VITE_GOOGLE_PAY_GATEWAY,
merchantName: import.meta.env.VITE_GOOGLE_PAY_MERCHANT_NAME,
```

**Benefit**: If an environment variable is missing:
- Application will fail to initialize Google Pay
- Error will be visible in browser console
- Developers will be immediately alerted to misconfiguration
- No payments can be processed with wrong credentials

## New Required Environment Variables

### Before (1 variable):
```bash
VITE_GOOGLE_MERCHANT_ID=BCR2DN4T7KNNPQQB
```

### After (4 variables):
```bash
# Google Pay Configuration (Frontend)
VITE_GOOGLE_MERCHANT_ID=BCR2DN4T7KNNPQQB
VITE_GOOGLE_PAY_MERCHANT_NAME=BabyBets
VITE_GOOGLE_PAY_GATEWAY=crst
VITE_GOOGLE_PAY_GATEWAY_MERCHANT_ID=283797
```

## What Each Variable Does

| Variable | Example Value | Purpose |
|----------|---------------|---------|
| **VITE_GOOGLE_MERCHANT_ID** | `BCR2DN4T7KNNPQQB` | Your Google Pay Business Console merchant ID |
| **VITE_GOOGLE_PAY_MERCHANT_NAME** | `BabyBets` | Business name shown in Google Pay payment sheet |
| **VITE_GOOGLE_PAY_GATEWAY** | `crst` | Payment gateway identifier (Cardstream for G2Pay) |
| **VITE_GOOGLE_PAY_GATEWAY_MERCHANT_ID** | `283797` | Your G2Pay merchant ID for the gateway |

## Why We Split These Variables

### 1. VITE_G2PAY_MERCHANT_ID vs VITE_GOOGLE_PAY_GATEWAY_MERCHANT_ID

**Q: Aren't these the same value?**

**A: Yes, but they serve different purposes:**

- `VITE_G2PAY_MERCHANT_ID`: Used for **direct card payments** to G2Pay
- `VITE_GOOGLE_PAY_GATEWAY_MERCHANT_ID`: Used for **Google Pay tokenization** configuration

**Why separate?**
- Flexibility: You might have different merchant IDs for different payment methods
- Clarity: Makes it explicit which credential is used where
- Security: Allows different values in development vs production

### 2. VITE_GOOGLE_PAY_GATEWAY

**Q: Why not hardcode `'crst'`?**

**A: Configuration flexibility:**
- Allows switching gateways without code changes
- Makes it explicit in environment configuration
- Different environments might use different gateways
- Clear documentation of gateway dependency

### 3. VITE_GOOGLE_PAY_MERCHANT_NAME

**Q: Why not hardcode `'BabyBets'`?**

**A: Branding control:**
- Different merchant names for different regions
- White-label support (if you rebrand)
- Test vs production naming
- Configured, not hardcoded

## How to Update Your Deployment

### 1. Vercel Environment Variables

Add these 3 new variables to Vercel:

1. Go to your Vercel project
2. Settings > Environment Variables
3. Add:
   ```
   VITE_GOOGLE_PAY_MERCHANT_NAME=BabyBets
   VITE_GOOGLE_PAY_GATEWAY=crst
   VITE_GOOGLE_PAY_GATEWAY_MERCHANT_ID=283797
   ```
4. Redeploy your application

### 2. Local .env File

Update your `.env` file:

```bash
# Add these 3 new variables
VITE_GOOGLE_PAY_MERCHANT_NAME=BabyBets
VITE_GOOGLE_PAY_GATEWAY=crst
VITE_GOOGLE_PAY_GATEWAY_MERCHANT_ID=283797
```

## Testing After Update

### 1. Check Environment Variables Are Set

Open browser console and check:

```javascript
console.log('Google Merchant ID:', import.meta.env.VITE_GOOGLE_MERCHANT_ID)
console.log('Merchant Name:', import.meta.env.VITE_GOOGLE_PAY_MERCHANT_NAME)
console.log('Gateway:', import.meta.env.VITE_GOOGLE_PAY_GATEWAY)
console.log('Gateway Merchant ID:', import.meta.env.VITE_GOOGLE_PAY_GATEWAY_MERCHANT_ID)
```

All should print actual values, not `undefined`.

### 2. Test Google Pay Initialization

1. Go to checkout page
2. Open browser console (F12)
3. Look for `[Google Pay]` logs
4. Should see: `✅ Available and ready`

If you see errors, check environment variables.

### 3. Test Payment Flow

1. Add items to cart
2. Proceed to checkout
3. Click Google Pay button
4. Complete test payment
5. Verify order completes successfully

## What Happens If Variable Is Missing?

### Before (with fallbacks):
```
❌ Uses wrong merchant ID silently
❌ Payment might go through with incorrect config
❌ No immediate error
❌ Hard to debug
```

### After (no fallbacks):
```
✅ Google Pay fails to initialize
✅ Clear error in console: "merchantId is undefined"
✅ Payment button doesn't appear
✅ Easy to debug - immediately obvious what's missing
```

## Security Best Practices Applied

1. ✅ **No Hardcoded Credentials**: All sensitive data from environment variables
2. ✅ **Fail Fast**: Missing config causes immediate failure
3. ✅ **Explicit Configuration**: Each value explicitly set, no assumptions
4. ✅ **Environment Separation**: Easy to have different values per environment
5. ✅ **Clear Documentation**: Each variable's purpose clearly documented

## Summary

**Changes Made:**
- ❌ Removed 4 hardcoded/fallback values
- ✅ Added 3 new environment variables
- ✅ Updated all documentation
- ✅ Improved security posture

**Action Required:**
1. Add 3 new environment variables to Vercel
2. Add 3 new environment variables to local `.env`
3. Redeploy application
4. Test Google Pay functionality

**Result:**
- More secure configuration
- Clearer error messages when misconfigured
- Better separation of concerns
- Production-ready security practices
