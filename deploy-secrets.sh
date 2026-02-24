#!/bin/bash

# BabyBets Edge Functions - Secrets Deployment Script
# Sets all required environment variables for edge functions

set -e  # Exit on error

echo "🔐 Deploying BabyBets Edge Function Secrets..."
echo ""

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "Please create a .env file with all required secrets"
    echo ""
    echo "Required secrets:"
    echo "  - MAILGUN_API_KEY"
    echo "  - MAILGUN_DOMAIN"
    echo "  - SMTP_FROM"
    echo "  - G2PAY_MERCHANT_ID"
    echo "  - G2PAY_SIGNATURE_KEY"
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_ANON_KEY"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    echo "  - APPLE_PAY_DISPLAY_NAME"
    echo "  - APPLE_PAY_DOMAIN_NAME"
    echo "  - PUBLIC_SITE_URL"
    echo ""
    echo "See .env.example for template"
    exit 1
fi

# Source .env file
echo "📄 Loading secrets from .env file..."
set -a
source .env
set +a

# Validate required secrets
REQUIRED_SECRETS=(
    "MAILGUN_API_KEY"
    "MAILGUN_DOMAIN"
    "SMTP_FROM"
    "G2PAY_MERCHANT_ID"
    "G2PAY_SIGNATURE_KEY"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "APPLE_PAY_DISPLAY_NAME"
    "APPLE_PAY_DOMAIN_NAME"
    "PUBLIC_SITE_URL"
)

MISSING_SECRETS=()
for secret in "${REQUIRED_SECRETS[@]}"; do
    if [ -z "${!secret}" ]; then
        MISSING_SECRETS+=("$secret")
    fi
done

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    echo "❌ Missing required secrets:"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "   - $secret"
    done
    echo ""
    echo "Please add these to your .env file"
    exit 1
fi

echo "✅ All required secrets found"
echo ""

# Deploy Email Notification Secrets
echo "📧 Deploying Email Notification Secrets..."
supabase secrets set MAILGUN_API_KEY="$MAILGUN_API_KEY"
supabase secrets set MAILGUN_DOMAIN="$MAILGUN_DOMAIN"
supabase secrets set SMTP_FROM="$SMTP_FROM"
echo "✅ Email secrets deployed"
echo ""

# Deploy G2Pay Payment Secrets
echo "💳 Deploying G2Pay Payment Secrets..."
supabase secrets set G2PAY_MERCHANT_ID="$G2PAY_MERCHANT_ID"
supabase secrets set G2PAY_SIGNATURE_KEY="$G2PAY_SIGNATURE_KEY"
echo "✅ Payment secrets deployed"
echo ""

# Deploy Supabase Configuration Secrets
echo "🔧 Deploying Supabase Configuration..."
supabase secrets set SUPABASE_URL="$SUPABASE_URL"
supabase secrets set SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
echo "✅ Supabase config deployed"
echo ""

# Deploy Apple Pay Secrets
echo "🍎 Deploying Apple Pay Configuration..."
supabase secrets set G2PAY_HOSTED_URL="${G2PAY_HOSTED_URL:-https://gateway.cardstream.com/hosted/}"
supabase secrets set APPLE_PAY_DISPLAY_NAME="${APPLE_PAY_DISPLAY_NAME:-BabyBets}"
supabase secrets set APPLE_PAY_DOMAIN_NAME="$APPLE_PAY_DOMAIN_NAME"
echo "✅ Apple Pay config deployed"
echo ""

# Deploy Public Site URL
echo "🌐 Deploying Public Site Configuration..."
supabase secrets set PUBLIC_SITE_URL="$PUBLIC_SITE_URL"
echo "✅ Public site URL deployed"
echo ""

echo "🎉 All secrets deployed successfully!"
echo ""
echo "📋 Deployed Secrets:"
echo "   ✓ MAILGUN_API_KEY - Mailgun API authentication"
echo "   ✓ MAILGUN_DOMAIN - Email sending domain"
echo "   ✓ SMTP_FROM - From email address"
echo "   ✓ G2PAY_MERCHANT_ID - G2Pay merchant ID"
echo "   ✓ G2PAY_SIGNATURE_KEY - G2Pay webhook signature verification"
echo "   ✓ SUPABASE_URL - Supabase project URL"
echo "   ✓ SUPABASE_ANON_KEY - Supabase public/anon key"
echo "   ✓ SUPABASE_SERVICE_ROLE_KEY - Supabase admin key"
echo "   ✓ G2PAY_HOSTED_URL - G2Pay hosted payment URL"
echo "   ✓ APPLE_PAY_DISPLAY_NAME - Merchant name for Apple Pay"
echo "   ✓ APPLE_PAY_DOMAIN_NAME - Your verified Apple Pay domain"
echo "   ✓ PUBLIC_SITE_URL - Public website URL"
echo ""
echo "📋 Next Steps:"
echo "1. Run ./deploy-functions.sh to deploy edge functions"
echo "2. Test email notifications (signup, orders, withdrawals)"
echo "3. Test payment processing with G2Pay and Apple Pay"
echo "4. Verify Apple Pay domain at: https://developer.apple.com"
echo ""
echo "💡 To view all secrets: supabase secrets list"
echo "💡 To unset a secret: supabase secrets unset SECRET_NAME"
echo ""
echo "✨ Your secrets are secure and ready!"
