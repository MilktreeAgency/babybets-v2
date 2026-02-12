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

echo "🎉 All secrets deployed successfully!"
echo ""
echo "📋 Deployed Secrets:"
echo "   ✓ MAILGUN_API_KEY - Mailgun API authentication"
echo "   ✓ MAILGUN_DOMAIN - Email sending domain (mail.babybets.co.uk)"
echo "   ✓ SMTP_FROM - From email address (noreply@mail.babybets.co.uk)"
echo "   ✓ G2PAY_MERCHANT_ID - G2Pay merchant ID"
echo "   ✓ G2PAY_SIGNATURE_KEY - G2Pay webhook signature verification"
echo ""
echo "📋 Next Steps:"
echo "1. Run ./deploy-functions.sh to deploy edge functions"
echo "2. Test email notifications (signup, orders, withdrawals)"
echo "3. Test payment processing with G2Pay"
echo ""
echo "💡 To view all secrets: supabase secrets list"
echo "💡 To unset a secret: supabase secrets unset SECRET_NAME"
echo ""
echo "✨ Your secrets are secure and ready!"
