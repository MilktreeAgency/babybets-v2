#!/bin/bash

# G2Pay Payment System - Function Deployment Script
# Deploys all three edge functions required for production payment processing

set -e  # Exit on error

echo "🚀 Deploying G2Pay Payment System Functions..."
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

echo "📦 Function 1/3: create-g2pay-session (Payment Processing)"
echo "   - Processes card payments via G2Pay Direct Integration"
echo "   - Registers webhook callback with G2Pay"
supabase functions deploy create-g2pay-session --no-verify-jwt
echo "✅ Deployed successfully"
echo ""

echo "📦 Function 2/3: complete-g2pay-order (Synchronous Ticket Allocation)"
echo "   - Completes orders when frontend receives payment response"
echo "   - Atomic ticket claiming with race condition protection"
supabase functions deploy complete-g2pay-order --no-verify-jwt
echo "✅ Deployed successfully"
echo ""

echo "📦 Function 3/3: g2pay-webhook (Asynchronous Payment Confirmation)"
echo "   - Receives payment confirmations from G2Pay backend"
echo "   - Ensures orders complete even if user closes browser"
echo "   - Signature verification for security"
supabase functions deploy g2pay-webhook --no-verify-jwt
echo "✅ Deployed successfully"
echo ""

echo "🎉 All functions deployed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Verify webhook URL in logs: https://<your-project>.supabase.co/functions/v1/g2pay-webhook"
echo "2. Test payment flow with real G2Pay sandbox card"
echo "3. Test reliability by closing browser during payment"
echo "4. Monitor payment_transactions table for webhook activity"
echo ""
echo "📚 Documentation:"
echo "   - WEBHOOK_IMPLEMENTATION.md - Complete webhook guide"
echo "   - DEPLOYMENT_SUMMARY.md - Deployment status and next steps"
echo "   - PRODUCTION_READY_G2PAY.md - Production readiness checklist"
echo ""
echo "✨ Your production-grade payment system is live!"
