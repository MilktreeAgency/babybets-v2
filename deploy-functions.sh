#!/bin/bash

# BabyBets Edge Functions - Deployment Script
# Deploys all edge functions required for production

set -e  # Exit on error

echo "🚀 Deploying BabyBets Edge Functions..."
echo ""

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "supabase/functions" ]; then
    echo "❌ Error: supabase/functions directory not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "📦 Function 1/4: create-g2pay-session (Payment Processing)"
echo "   - Processes card payments via G2Pay Direct Integration"
echo "   - Registers webhook callback with G2Pay"
echo "   - 🔒 JWT verification enabled (requires authenticated users)"
supabase functions deploy create-g2pay-session
echo "✅ Deployed successfully"
echo ""

echo "📦 Function 2/4: complete-g2pay-order (Synchronous Ticket Allocation)"
echo "   - Completes orders when frontend receives payment response"
echo "   - Atomic ticket claiming with race condition protection"
echo "   - 🔒 JWT verification enabled (requires authenticated users)"
supabase functions deploy complete-g2pay-order
echo "✅ Deployed successfully"
echo ""

echo "📦 Function 3/4: g2pay-webhook (Asynchronous Payment Confirmation)"
echo "   - Receives payment confirmations from G2Pay backend"
echo "   - Ensures orders complete even if user closes browser"
echo "   - 🔓 No JWT verification (called by G2Pay, uses signature verification)"
supabase functions deploy g2pay-webhook --no-verify-jwt
echo "✅ Deployed successfully"
echo ""

echo "📦 Function 4/4: send-notification-email (Email Notification System)"
echo "   - Sends all transactional emails via Mailgun"
echo "   - 14 email templates with BabyBets branding"
echo "   - 🔓 No JWT verification (internal service, uses service role key)"
supabase functions deploy send-notification-email --no-verify-jwt
echo "✅ Deployed successfully"
echo ""

echo "🎉 All functions deployed successfully!"
echo ""
echo "📋 Deployed Functions:"
echo "   ✓ create-g2pay-session - Payment processing (🔒 JWT required)"
echo "   ✓ complete-g2pay-order - Order completion (🔒 JWT required)"
echo "   ✓ g2pay-webhook - Payment confirmations (🔓 Public webhook)"
echo "   ✓ send-notification-email - Email notifications (🔓 Internal service)"
echo ""
echo "🔒 Security Notes:"
echo "   • User-facing functions (create/complete-order) require JWT authentication"
echo "   • G2Pay webhook uses signature verification instead of JWT"
echo "   • Email service is internal-only (called from backend with service role key)"
echo ""
echo "📋 Next Steps:"
echo "1. Test payment flow with G2Pay sandbox card"
echo "2. Test email notifications (Welcome, Orders, Withdrawals, etc.)"
echo "3. Monitor email_notifications table for email delivery status"
echo "4. Verify webhook URL: https://<your-project>.supabase.co/functions/v1/g2pay-webhook"
echo ""
echo "✨ Your production system is live!"
