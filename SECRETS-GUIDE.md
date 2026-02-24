# BabyBets Secrets Reference

## Summary: What You Have in Supabase

You currently have these secrets set in Supabase:
```
✅ MAILGUN_API_KEY
✅ MAILGUN_DOMAIN
✅ SMTP_FROM
✅ G2PAY_MERCHANT_ID
✅ G2PAY_SIGNATURE_KEY
✅ SUPABASE_URL
✅ SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
❓ SUPABASE_DB_URL (NOT USED - can be removed)
✅ G2PAY_HOSTED_URL
✅ APPLE_PAY_DISPLAY_NAME
✅ APPLE_PAY_DOMAIN_NAME
```

## Analysis: Which Secrets Are Actually Needed

### ✅ REQUIRED - Must Have

These 5 secrets are **absolutely required** with no defaults:

1. **MAILGUN_API_KEY**
   - Used in: `send-notification-email`
   - Purpose: Sends all email notifications
   - How to get: Mailgun Dashboard > API Keys

2. **MAILGUN_DOMAIN**
   - Used in: `send-notification-email`
   - Purpose: Your verified email domain
   - Example: `mail.babybets.co.uk`

3. **SMTP_FROM**
   - Used in: `send-notification-email`
   - Purpose: From email address
   - Example: `noreply@mail.babybets.co.uk`

4. **G2PAY_MERCHANT_ID**
   - Used in: `create-g2pay-session`, `validate-apple-merchant`, `process-wallet-payment`
   - Purpose: Your G2Pay merchant identifier
   - How to get: Provided by G2Pay

5. **G2PAY_SIGNATURE_KEY**
   - Used in: `g2pay-webhook`, `create-g2pay-session`, `validate-apple-merchant`, `process-wallet-payment`
   - Purpose: Webhook signature verification
   - How to get: Provided by G2Pay

### ✅ AUTO-INJECTED (but recommended to set explicitly)

These 3 secrets are automatically injected by Supabase into edge functions, but explicitly setting them is recommended:

6. **SUPABASE_URL**
   - Used in: Almost all edge functions
   - Purpose: Your Supabase project URL
   - Auto-injected: Yes (but good to set explicitly)
   - Example: `https://xxxxx.supabase.co`

7. **SUPABASE_ANON_KEY**
   - Used in: Multiple functions for public database access
   - Purpose: Public/anonymous API key
   - Auto-injected: Yes (but good to set explicitly)
   - Get from: Supabase Dashboard > Settings > API > anon key

8. **SUPABASE_SERVICE_ROLE_KEY**
   - Used in: Most functions for admin database access
   - Purpose: Bypass RLS, full admin access
   - Auto-injected: Yes (but good to set explicitly)
   - Get from: Supabase Dashboard > Settings > API > service_role key
   - ⚠️ CRITICAL: Keep this secret! Never expose to frontend

### ✅ REQUIRED for Apple Pay

These 3 secrets are needed if you want Apple Pay to work:

9. **G2PAY_HOSTED_URL**
   - Used in: `validate-apple-merchant`
   - Purpose: G2Pay hosted payment gateway URL
   - Default: `https://gateway.cardstream.com/hosted/`
   - You can use the default or override

10. **APPLE_PAY_DISPLAY_NAME**
    - Used in: `validate-apple-merchant`
    - Purpose: Merchant name shown in Apple Pay sheet
    - Default: `BabyBets`
    - You can use the default or customize

11. **APPLE_PAY_DOMAIN_NAME**
    - Used in: `validate-apple-merchant`
    - Purpose: Your Apple Pay verified domain
    - Example: `babybets.co.uk`
    - Must match domain verified with Apple

### 📝 OPTIONAL (have defaults)

12. **PUBLIC_SITE_URL**
    - Used in: Email templates for links
    - Purpose: Your public website URL
    - Default: `https://babybets.co.uk`
    - Optional: Set if your domain is different

### ❌ NOT USED - Can Remove

13. **SUPABASE_DB_URL**
    - ❌ Not found in any edge function code
    - You can safely remove this secret

## Where Each Secret Is Used

### Email Functions
- `send-notification-email`
  - MAILGUN_API_KEY ✅
  - MAILGUN_DOMAIN ✅
  - SMTP_FROM ✅
  - SUPABASE_URL ✅
  - SUPABASE_SERVICE_ROLE_KEY ✅
  - PUBLIC_SITE_URL (optional)

### Payment Functions
- `create-g2pay-session`
  - G2PAY_MERCHANT_ID ✅
  - G2PAY_SIGNATURE_KEY ✅
  - SUPABASE_URL ✅
  - SUPABASE_ANON_KEY ✅
  - SUPABASE_SERVICE_ROLE_KEY ✅

- `complete-g2pay-order`
  - SUPABASE_URL ✅
  - SUPABASE_ANON_KEY ✅
  - SUPABASE_SERVICE_ROLE_KEY ✅

- `g2pay-webhook`
  - G2PAY_SIGNATURE_KEY ✅
  - SUPABASE_URL ✅
  - SUPABASE_SERVICE_ROLE_KEY ✅

### Apple Pay Functions
- `validate-apple-merchant`
  - G2PAY_MERCHANT_ID ✅
  - G2PAY_SIGNATURE_KEY ✅
  - G2PAY_HOSTED_URL ✅
  - APPLE_PAY_DISPLAY_NAME ✅
  - APPLE_PAY_DOMAIN_NAME ✅
  - SUPABASE_URL ✅
  - SUPABASE_ANON_KEY ✅

- `process-wallet-payment`
  - G2PAY_MERCHANT_ID ✅
  - G2PAY_SIGNATURE_KEY ✅
  - SUPABASE_URL ✅
  - SUPABASE_ANON_KEY ✅
  - SUPABASE_SERVICE_ROLE_KEY ✅

### Other Functions
- `claim-wheel-prize`
  - SUPABASE_URL ✅
  - SUPABASE_SERVICE_ROLE_KEY ✅

- `approve-influencer-application`
  - SUPABASE_URL ✅
  - SUPABASE_ANON_KEY ✅
  - SUPABASE_SERVICE_ROLE_KEY ✅

- `auto-execute-draws`
  - SUPABASE_URL ✅
  - SUPABASE_SERVICE_ROLE_KEY ✅

- `process-monthly-payouts`
  - SUPABASE_URL ✅
  - SUPABASE_SERVICE_ROLE_KEY ✅

## How to Get Each Secret

### Mailgun Secrets
1. Go to [mailgun.com](https://www.mailgun.com) and log in
2. Navigate to "Sending" > "Domain Settings"
3. Select your domain or add a new one
4. Copy:
   - **API Key**: Settings > API Keys > Private API key
   - **Domain**: Your verified domain (e.g., `mail.babybets.co.uk`)
   - **From Email**: Any email on your domain (e.g., `noreply@mail.babybets.co.uk`)

### G2Pay Secrets
Contact G2Pay support or check your merchant dashboard:
- **Merchant ID**: Your unique merchant identifier (e.g., `283797`)
- **Signature Key**: Secret key for webhook verification

### Supabase Secrets
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy:
   - **URL**: Project URL (e.g., `https://xxxxx.supabase.co`)
   - **Anon Key**: anon / public key (safe to expose to frontend)
   - **Service Role Key**: service_role key (⚠️ KEEP SECRET - never expose to frontend)

### Apple Pay Secrets
1. **G2PAY_HOSTED_URL**: Provided by G2Pay (usually `https://gateway.cardstream.com/hosted/`)
2. **APPLE_PAY_DISPLAY_NAME**: Your merchant name (e.g., `BabyBets`)
3. **APPLE_PAY_DOMAIN_NAME**: Your domain verified with Apple (e.g., `babybets.co.uk`)
   - Verify domain at: https://developer.apple.com > Certificates, Identifiers & Profiles > Merchant IDs

## Deployment Checklist

When deploying, make sure you have:

- [ ] Created `.env` file with all secrets
- [ ] Verified all secrets are correct (no placeholder values)
- [ ] Run `./deploy-secrets.sh` to deploy secrets to Supabase
- [ ] Run `supabase secrets list` to verify all secrets are set
- [ ] Remove `SUPABASE_DB_URL` if it exists (not used)
- [ ] Test email sending
- [ ] Test card payments
- [ ] Test Apple Pay (if applicable)

## Security Best Practices

1. **Never commit `.env` to git** - It's in `.gitignore` by default
2. **Keep `SUPABASE_SERVICE_ROLE_KEY` secret** - Never expose to frontend or public
3. **Use different keys for development and production**
4. **Rotate secrets regularly** - Especially after team member changes
5. **Verify Mailgun domain** - Ensure SPF/DKIM records are set up
6. **Monitor usage** - Check Mailgun and G2Pay dashboards for suspicious activity
7. **Enable Rate Limiting** - Configure in Supabase if needed

## Need Help?

If you're missing a secret or having trouble:

1. **Check what's currently deployed:**
   ```bash
   supabase secrets list
   ```

2. **View a specific secret:**
   ```bash
   supabase secrets list | grep SECRET_NAME
   ```

3. **Remove an unused secret:**
   ```bash
   supabase secrets unset SUPABASE_DB_URL
   ```

4. **Re-deploy a secret:**
   ```bash
   supabase secrets set SECRET_NAME="value"
   ```

5. **Re-deploy all secrets:**
   ```bash
   ./deploy-secrets.sh
   ```
