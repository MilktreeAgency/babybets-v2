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

echo "📦 Function 1/8: create-g2pay-hosted-session (Hosted Payment Session)"
echo "   - Creates G2Pay hosted payment session"
echo "   - Redirects users to G2Pay's secure payment page"
echo "   - 🔓 No JWT verification (Supabase edge function compatibility)"
supabase functions deploy create-g2pay-hosted-session --no-verify-jwt
echo "✅ Deployed successfully"
echo ""

echo "📦 Function 2/8: complete-g2pay-order (Synchronous Ticket Allocation)"
echo "   - Completes orders when frontend receives payment response"
echo "   - Atomic ticket claiming with race condition protection"
echo "   - 🔓 No JWT verification (Supabase edge function compatibility)"
supabase functions deploy complete-g2pay-order --no-verify-jwt
echo "✅ Deployed successfully"
echo ""

echo "📦 Function 3/8: g2pay-webhook (Asynchronous Payment Confirmation)"
echo "   - Receives payment confirmations from G2Pay backend"
echo "   - Ensures orders complete even if user closes browser"
echo "   - 🔓 No JWT verification (called by G2Pay, uses signature verification)"
supabase functions deploy g2pay-webhook --no-verify-jwt
echo "✅ Deployed successfully"
echo ""

echo "📦 Function 4/8: send-notification-email (Email Notification System)"
echo "   - Sends all transactional emails via Mailgun"
echo "   - 14 email templates with BabyBets branding"
echo "   - 🔓 No JWT verification (internal service, uses service role key)"
supabase functions deploy send-notification-email --no-verify-jwt
echo "✅ Deployed successfully"
echo ""

echo "📦 Function 5/8: approve-influencer-application (Influencer Management)"
echo "   - Approves influencer applications and creates accounts"
echo "   - 🔓 No JWT verification (internal service)"
supabase functions deploy approve-influencer-application --no-verify-jwt
echo "✅ Deployed successfully"
echo ""

echo "📦 Function 6/8: auto-execute-draws (Automated Draw Execution)"
echo "   - Automatically executes draws when end time is reached"
echo "   - 🔓 No JWT verification (cron job)"
supabase functions deploy auto-execute-draws --no-verify-jwt
echo "✅ Deployed successfully"
echo ""

echo "📦 Function 7/8: claim-wheel-prize (Wheel Prize Claims)"
echo "   - Handles spinning wheel prize claims"
echo "   - 🔓 No JWT verification (Supabase edge function compatibility)"
supabase functions deploy claim-wheel-prize --no-verify-jwt
echo "✅ Deployed successfully"
echo ""

echo "📦 Function 8/8: process-monthly-payouts (Influencer Payouts)"
echo "   - Processes monthly influencer commission payouts"
echo "   - 🔓 No JWT verification (cron job)"
supabase functions deploy process-monthly-payouts --no-verify-jwt
echo "✅ Deployed successfully"
echo ""

echo "🎉 All 8 functions deployed successfully!"
echo ""
echo "📋 Deployed Functions:"
echo "   ✓ create-g2pay-hosted-session - Hosted payment session (🔓 No JWT)"
echo "   ✓ complete-g2pay-order - Order completion (🔓 No JWT)"
echo "   ✓ g2pay-webhook - Payment confirmations (🔓 No JWT)"
echo "   ✓ send-notification-email - Email notifications (🔓 No JWT)"
echo "   ✓ approve-influencer-application - Influencer management (🔓 No JWT)"
echo "   ✓ auto-execute-draws - Automated draw execution (🔓 No JWT)"
echo "   ✓ claim-wheel-prize - Wheel prize claims (🔓 No JWT)"
echo "   ✓ process-monthly-payouts - Influencer payouts (🔓 No JWT)"
echo ""
echo "🔒 Security Notes:"
echo "   • All functions deployed with --no-verify-jwt for Supabase compatibility"
echo "   • Payment functions use service role key for authentication"
echo "   • G2Pay webhook uses signature verification for security"
echo "   • Email service is internal-only (called from backend with service role key)"
echo ""
echo "💳 Payment Flow (Hosted Solution):"
echo "   1. User → Checkout page"
echo "   2. Frontend → create-g2pay-hosted-session edge function"
echo "   3. Edge function → G2Pay API (creates hosted session)"
echo "   4. User → G2Pay hosted payment page (card, Apple Pay, Google Pay)"
echo "   5. G2Pay → Redirect back to /payment-return"
echo "   6. G2Pay → g2pay-webhook (background confirmation)"
echo "   7. Webhook → Allocates tickets and sends email"
echo ""
echo "📋 Next Steps:"
echo "1. Test payment flow with G2Pay hosted page"
echo "2. Test Apple Pay and Google Pay on G2Pay's hosted page"
echo "3. Test wallet-only payment (finalPrice === 0)"
echo "4. Test email notifications (Welcome, Orders, Withdrawals, etc.)"
echo "5. Test wheel prize claiming functionality"
echo "6. Monitor email_notifications table for email delivery status"
echo "7. Verify webhook URL: https://<your-project>.supabase.co/functions/v1/g2pay-webhook"
echo ""
echo "✨ Your production system is live!"
