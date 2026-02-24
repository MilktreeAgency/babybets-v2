# BabyBets Deployment Guide

This guide will walk you through deploying your BabyBets application to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
3. [Backend Deployment (Supabase)](#backend-deployment-supabase)
4. [GitHub Actions Setup](#github-actions-setup)
5. [Testing Your Deployment](#testing-your-deployment)

---

## Prerequisites

Before you start, you need:

1. **Supabase Project** - Your production Supabase project
2. **Vercel Account** - For frontend hosting
3. **GitHub Repository** - Your code repository
4. **Supabase CLI** - Install with: `npm install -g supabase`
5. **Required API Keys**:
   - Mailgun API Key (for email notifications)
   - G2Pay Merchant ID and Signature Key (for payments)

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Your Environment Variables

You need to add these environment variables in Vercel:

#### Required Environment Variables for Vercel:

```bash
# Supabase Connection (Frontend needs these)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Payment Gateway Configuration (Frontend)
VITE_G2PAY_MERCHANT_ID=283797
VITE_GOOGLE_MERCHANT_ID=BCR2DN4T7KNNPQQB
```

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and log in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure your project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add the environment variables listed above
6. Click "Deploy"

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Step 3: Get Your Vercel Environment Variables

To get the required values:

1. **VITE_SUPABASE_URL**:
   - Go to your Supabase project dashboard
   - Settings > API > Project URL
   - Copy: `https://xxxxx.supabase.co`

2. **VITE_SUPABASE_ANON_KEY**:
   - Go to your Supabase project dashboard
   - Settings > API > Project API keys
   - Copy the "anon" / "public" key (NOT the service_role key)

3. **VITE_G2PAY_MERCHANT_ID**:
   - Your G2Pay merchant ID (provided by G2Pay)
   - Default in example: `283797`

4. **VITE_GOOGLE_MERCHANT_ID**:
   - Your Google Pay Business Console merchant ID
   - Get from: https://pay.google.com/business/console/
   - Format: Usually starts with `BCR2DN4T`
   - Example: `BCR2DN4T7KNNPQQB`

---

## Backend Deployment (Supabase)

### Step 1: Prepare Your .env File

Create a `.env` file in your project root with these values:

```bash
# Frontend Environment Variables (also needed for deployment scripts)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Supabase CLI Access (for deploying edge functions)
SUPABASE_ACCESS_TOKEN=your_supabase_access_token_here

# Payment Gateway Configuration (Frontend)
VITE_G2PAY_MERCHANT_ID=283797
VITE_GOOGLE_MERCHANT_ID=BCR2DN4T7KNNPQQB

# ==========================================
# Edge Function Secrets (deployed to Supabase)
# ==========================================

# Email Notification Secrets
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=mail.babybets.co.uk
SMTP_FROM=noreply@mail.babybets.co.uk

# G2Pay Payment Secrets
G2PAY_MERCHANT_ID=283797
G2PAY_SIGNATURE_KEY=your_g2pay_signature_key_here

# Supabase Configuration (auto-injected, but explicitly setting is recommended)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Apple Pay Configuration
G2PAY_HOSTED_URL=https://gateway.cardstream.com/hosted/
APPLE_PAY_DISPLAY_NAME=BabyBets
APPLE_PAY_DOMAIN_NAME=babybets.co.uk

# Public Site URL (used in email templates)
PUBLIC_SITE_URL=https://babybets.co.uk
```

### Step 2: Get Your Supabase Access Token

To deploy edge functions, you need a Supabase access token:

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click your profile icon (top right)
3. Click "Account Settings"
4. Go to "Access Tokens"
5. Click "Generate New Token"
6. Give it a name (e.g., "BabyBets Deploy")
7. Copy the token and add it to your `.env` file as `SUPABASE_ACCESS_TOKEN`

### Step 3: Get Your G2Pay Credentials

Contact G2Pay support to get:
- **Merchant ID**: Your unique merchant identifier
- **Signature Key**: Secret key for webhook signature verification

### Step 4: Get Your Google Pay Merchant ID

1. Go to [Google Pay Business Console](https://pay.google.com/business/console/)
2. Sign in with your Google account
3. Register your business (if not already registered)
4. Navigate to "Integration" settings
5. Select "Gateway" as integration type
6. Choose "Cardstream" as your gateway (G2Pay uses Cardstream)
7. Copy your **Merchant ID** (format: `BCR2DN4TXXXXXXX`)
8. Add to your `.env` file as `VITE_GOOGLE_MERCHANT_ID`

### Step 5: Get Your Mailgun Credentials

1. Go to [mailgun.com](https://www.mailgun.com) and log in
2. Go to "Sending" > "Domain Settings"
3. Select your domain (or add `mail.babybets.co.uk`)
4. Copy:
   - **API Key**: Found in "Domain Settings" > "Sending API keys"
   - **Domain**: Your verified domain (e.g., `mail.babybets.co.uk`)
   - **From Email**: Set this to `noreply@mail.babybets.co.uk`

### Step 5: Deploy Secrets to Supabase

Once your `.env` file is ready, run:

```bash
# Make scripts executable
chmod +x deploy-secrets.sh
chmod +x deploy-functions.sh

# Deploy secrets to Supabase edge functions
./deploy-secrets.sh
```

This script will:
- Load all secrets from your `.env` file
- Validate that all required secrets exist
- Deploy them securely to Supabase edge functions

You should see:
```
✅ All required secrets found
📧 Deploying Email Notification Secrets...
✅ Email secrets deployed
💳 Deploying G2Pay Payment Secrets...
✅ Payment secrets deployed
🔧 Deploying Supabase Configuration...
✅ Supabase config deployed
🍎 Deploying Apple Pay Configuration...
✅ Apple Pay config deployed
🌐 Deploying Public Site Configuration...
✅ Public site URL deployed
🎉 All secrets deployed successfully!
```

### Step 6: Deploy Edge Functions to Supabase

After secrets are deployed, deploy all edge functions:

```bash
./deploy-functions.sh
```

This will deploy 10 edge functions:
1. **create-g2pay-session** - Card payment processing
2. **complete-g2pay-order** - Order completion & ticket allocation
3. **g2pay-webhook** - Payment confirmation webhook
4. **send-notification-email** - Email notification system
5. **process-wallet-payment** - Apple Pay / Google Pay
6. **validate-apple-merchant** - Apple Pay merchant validation
7. **approve-influencer-application** - Influencer approval
8. **claim-wheel-prize** - Spin wheel prize claiming
9. **auto-execute-draws** - Automatic competition draws
10. **process-monthly-payouts** - Monthly influencer commissions

You should see:
```
🎉 All functions deployed successfully!
```

### Step 7: Verify Deployment

Check that your secrets were deployed correctly:

```bash
# List all secrets
supabase secrets list

# Should show:
# - MAILGUN_API_KEY
# - MAILGUN_DOMAIN
# - SMTP_FROM
# - G2PAY_MERCHANT_ID
# - G2PAY_SIGNATURE_KEY
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - G2PAY_HOSTED_URL
# - APPLE_PAY_DISPLAY_NAME
# - APPLE_PAY_DOMAIN_NAME
# - PUBLIC_SITE_URL
```

---

## GitHub Actions Setup

Your repository includes automated workflows that run scheduled tasks. These need GitHub Secrets configured.

### Required GitHub Secrets

Go to your GitHub repository:
1. Click "Settings" tab
2. Go to "Secrets and variables" > "Actions"
3. Click "New repository secret"

Add these 2 secrets:

#### 1. SUPABASE_URL
```
Value: https://your-project.supabase.co
```
- This is your Supabase project URL
- Same as `VITE_SUPABASE_URL`

#### 2. SUPABASE_SERVICE_ROLE_KEY
```
Value: your_supabase_service_role_key_here
```
- This is your Supabase **service_role** key (NOT the anon key)
- Go to Supabase Dashboard > Settings > API > Project API keys
- Copy the "service_role" key (keep this SECRET - it bypasses all security rules)

### What These GitHub Actions Do

#### 1. Auto Execute Draws (`.github/workflows/auto-execute-draws.yml`)
- **Schedule**: Runs every 15 minutes
- **Purpose**: Automatically executes competition draws when end time is reached
- **How it works**: Calls the `auto-execute-draws` edge function

#### 2. Monthly Payouts (`.github/workflows/monthly-payouts.yml`)
- **Schedule**: Runs at 00:30 UTC on the 1st of every month
- **Purpose**: Processes monthly influencer commission payouts
- **How it works**: Calls the `process-monthly-payouts` edge function

---

## Testing Your Deployment

### 1. Test Frontend

Visit your Vercel deployment URL:
```
https://your-app.vercel.app
```

Check:
- Homepage loads correctly
- Can view competitions
- Can sign up / log in
- Images and videos load

### 2. Test Payment System

1. Go to a competition page
2. Add tickets to cart
3. Click "Checkout"
4. Use G2Pay test card:
   - **Card Number**: 4929421234600821
   - **Expiry**: Any future date (e.g., 12/25)
   - **CVV**: 356
   - **Name**: TEST USER
5. Complete payment
6. Verify:
   - Payment succeeds
   - Tickets appear in your account
   - Email confirmation received

### 3. Test Email Notifications

Check your email for:
- Welcome email after signup
- Order confirmation after purchase
- Any other notification emails

If emails aren't arriving:
- Check Mailgun dashboard for delivery logs
- Verify your domain is verified in Mailgun
- Check spam folder

### 4. Test Edge Functions

You can manually test edge functions using curl:

```bash
# Test email function (replace with your values)
curl -X POST 'https://your-project.supabase.co/functions/v1/send-notification-email' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "template": "welcome",
    "data": {
      "display_name": "Test User"
    }
  }'
```

### 5. Test GitHub Actions

#### Test Auto Execute Draws:
1. Go to your GitHub repository
2. Click "Actions" tab
3. Click "Auto Execute Competition Draws"
4. Click "Run workflow" dropdown
5. Click "Run workflow" button
6. Check the logs to see if it runs successfully

#### Test Monthly Payouts:
1. Same steps as above
2. Select "Monthly Influencer Commission Payouts" workflow
3. Run manually to test

---

## Troubleshooting

### Frontend Issues

**Problem**: "Missing Supabase environment variables" error
- **Solution**: Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel
- Redeploy after adding variables

**Problem**: Payment not working
- **Solution**:
  - Verify `VITE_G2PAY_MERCHANT_ID` is set
  - Check G2Pay merchant account is active
  - Check browser console for errors

### Backend Issues

**Problem**: Edge function deployment fails
- **Solution**:
  - Verify `SUPABASE_ACCESS_TOKEN` is valid
  - Check you're logged in: `supabase login`
  - Try manual deploy: `supabase functions deploy function-name --no-verify-jwt`

**Problem**: Emails not sending
- **Solution**:
  - Verify Mailgun API key: `supabase secrets list`
  - Check Mailgun dashboard for error logs
  - Verify domain is verified in Mailgun
  - Check email is not in spam folder

**Problem**: Payment webhook not working
- **Solution**:
  - Verify `G2PAY_SIGNATURE_KEY` is correct
  - Check G2Pay dashboard for webhook logs
  - Verify webhook URL in G2Pay: `https://your-project.supabase.co/functions/v1/g2pay-webhook`

### GitHub Actions Issues

**Problem**: Workflows failing with 401 error
- **Solution**:
  - Verify `SUPABASE_SERVICE_ROLE_KEY` is correct (not the anon key)
  - Check the key hasn't expired
  - Regenerate key if needed from Supabase dashboard

**Problem**: Workflows not running on schedule
- **Solution**:
  - GitHub Actions may have delays up to 15 minutes
  - Check workflow is enabled in "Actions" tab
  - Try running manually first to verify it works

---

## Security Checklist

Before going live, ensure:

- [ ] Never commit `.env` file to git (it's in `.gitignore`)
- [ ] Use production G2Pay credentials (not sandbox)
- [ ] Verify Mailgun domain is properly configured with SPF/DKIM records
- [ ] Keep `SUPABASE_SERVICE_ROLE_KEY` secret - never expose to frontend
- [ ] Frontend only uses `VITE_SUPABASE_ANON_KEY` (not service role)
- [ ] Enable Supabase Row Level Security (RLS) on all tables
- [ ] Test payment refund process with G2Pay
- [ ] Set up monitoring for edge function errors
- [ ] Configure rate limiting in Supabase if needed

---

## Quick Reference

### Where Each Secret Lives:

| Secret | Vercel | .env File | Supabase Edge Functions | GitHub Actions |
|--------|---------|-----------|-------------------------|----------------|
| VITE_SUPABASE_URL | ✅ | ✅ | ❌ | ❌ (uses SUPABASE_URL) |
| VITE_SUPABASE_ANON_KEY | ✅ | ✅ | ❌ | ❌ |
| VITE_G2PAY_MERCHANT_ID | ✅ | ✅ | ❌ | ❌ |
| VITE_GOOGLE_MERCHANT_ID | ✅ | ✅ | ❌ | ❌ |
| SUPABASE_ACCESS_TOKEN | ❌ | ✅ (for deploy) | ❌ | ❌ |
| MAILGUN_API_KEY | ❌ | ✅ | ✅ | ❌ |
| MAILGUN_DOMAIN | ❌ | ✅ | ✅ | ❌ |
| SMTP_FROM | ❌ | ✅ | ✅ | ❌ |
| G2PAY_MERCHANT_ID | ❌ | ✅ | ✅ | ❌ |
| G2PAY_SIGNATURE_KEY | ❌ | ✅ | ✅ | ❌ |
| SUPABASE_URL | ❌ | ✅ | ✅ | ✅ |
| SUPABASE_ANON_KEY | ❌ | ✅ | ✅ | ❌ |
| SUPABASE_SERVICE_ROLE_KEY | ❌ | ✅ | ✅ | ✅ |
| G2PAY_HOSTED_URL | ❌ | ✅ | ✅ | ❌ |
| APPLE_PAY_DISPLAY_NAME | ❌ | ✅ | ✅ | ❌ |
| APPLE_PAY_DOMAIN_NAME | ❌ | ✅ | ✅ | ❌ |
| PUBLIC_SITE_URL | ❌ | ✅ | ✅ | ❌ |

### Deployment Commands:

```bash
# Deploy secrets to Supabase
./deploy-secrets.sh

# Deploy edge functions to Supabase
./deploy-functions.sh

# Deploy frontend to Vercel
vercel --prod

# Check deployed secrets
supabase secrets list

# Manual function deploy
supabase functions deploy function-name --no-verify-jwt
```

---

## Need Help?

If you encounter issues:

1. Check the error logs:
   - **Frontend**: Browser console (F12)
   - **Edge Functions**: Supabase Dashboard > Functions > Logs
   - **GitHub Actions**: Repository > Actions tab > Click workflow run

2. Verify all secrets are set:
   ```bash
   # Supabase secrets
   supabase secrets list

   # GitHub secrets
   # Go to Settings > Secrets and variables > Actions

   # Vercel secrets
   # Go to Project Settings > Environment Variables
   ```

3. Common issues:
   - **401 Unauthorized**: Wrong API key or expired token
   - **403 Forbidden**: Missing permissions or RLS blocking access
   - **500 Server Error**: Check edge function logs for details
   - **Network Error**: Check Supabase project is active and URLs are correct

---

## Summary

To deploy BabyBets:

1. **Frontend (Vercel)**:
   - Set 3 environment variables
   - Deploy via dashboard or CLI

2. **Backend (Supabase)**:
   - Create `.env` file with all secrets
   - Run `./deploy-secrets.sh`
   - Run `./deploy-functions.sh`

3. **GitHub Actions**:
   - Add 2 repository secrets
   - Workflows run automatically

That's it! Your BabyBets application is now live in production.
