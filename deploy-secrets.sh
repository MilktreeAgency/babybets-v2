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
    echo "  - G2PAY_HOSTED_URL"
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_ANON_KEY"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    echo "  - PUBLIC_SITE_URL"
    echo "  - SITE_URL"
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
    "G2PAY_HOSTED_URL"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "PUBLIC_SITE_URL"
    "SITE_URL"
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

# Deploy G2Pay Payment Secrets (Production Credentials)
echo "💳 Deploying G2Pay Payment Secrets (Hosted Solution)..."
supabase secrets set G2PAY_MERCHANT_ID="$G2PAY_MERCHANT_ID"
supabase secrets set G2PAY_SIGNATURE_KEY="$G2PAY_SIGNATURE_KEY"
supabase secrets set G2PAY_HOSTED_URL="$G2PAY_HOSTED_URL"
echo "✅ Payment secrets deployed"
echo ""
echo "📋 G2Pay Production Configuration:"
echo "   • Merchant ID: $G2PAY_MERCHANT_ID"
echo "   • Hosted URL: $G2PAY_HOSTED_URL"
echo "   • Signature Key: [HIDDEN]"
echo ""

# Supabase Configuration (automatically available in edge functions)
echo "🔧 Supabase Configuration (Auto-provided)..."
echo "   ℹ️  SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY"
echo "   ℹ️  are automatically available in all edge functions"
echo "✅ No deployment needed"
echo ""

# Deploy Public Site URL
echo "🌐 Deploying Public Site Configuration..."
supabase secrets set PUBLIC_SITE_URL="$PUBLIC_SITE_URL"
supabase secrets set SITE_URL="$SITE_URL"
echo "✅ Public site URL deployed"
echo ""

echo "🎉 All secrets deployed successfully!"
echo ""
echo "📋 Deployed Secrets:"
echo "   ✓ MAILGUN_API_KEY - Mailgun API authentication"
echo "   ✓ MAILGUN_DOMAIN - Email sending domain"
echo "   ✓ SMTP_FROM - From email address"
echo "   ✓ G2PAY_MERCHANT_ID - G2Pay production merchant ID (283797)"
echo "   ✓ G2PAY_SIGNATURE_KEY - G2Pay webhook signature verification"
echo "   ✓ G2PAY_HOSTED_URL - G2Pay hosted payment page URL"
echo "   ✓ PUBLIC_SITE_URL - Public website URL (for emails)"
echo "   ✓ SITE_URL - Site URL (for redirects)"
echo ""
echo "💳 Payment Integration Notes:"
echo "   • Using G2Pay Hosted Payment Page (Postbridge Modal)"
echo "   • Apple Pay and Google Pay handled by G2Pay (no domain verification needed)"
echo "   • G2Pay Merchant Name: Babybets"
echo "   • Google Pay Merchant ID: BCR2DN5TW2AJL7K3"
echo "   • Payment methods: Card, Apple Pay, Google Pay"
echo ""
echo "📋 Next Steps:"
echo "1. Run ./deploy-functions.sh to deploy edge functions"
echo "2. Test email notifications (signup, orders, withdrawals)"
echo "3. Test hosted payment flow:"
echo "   - Create order → Redirect to G2Pay hosted page"
echo "   - Complete payment → Redirect back to /payment-return"
echo "   - Webhook confirms payment → Tickets allocated"
echo "4. Test Apple Pay on Safari/iOS device"
echo "5. Test Google Pay on Chrome/Android device"
echo "6. Monitor webhook at: $SUPABASE_URL/functions/v1/g2pay-webhook"
echo ""
echo "💡 To view all secrets: supabase secrets list"
echo "💡 To unset a secret: supabase secrets unset SECRET_NAME"
echo ""
echo "✨ Your secrets are secure and ready!"
