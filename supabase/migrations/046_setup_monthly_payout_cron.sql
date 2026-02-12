-- ============================================
-- SETUP AUTOMATIC MONTHLY COMMISSION PAYOUTS
-- Description: Cron job to automatically payout influencer commissions at end of month
-- Date: 2026-02-13
-- ============================================

-- OPTION 1: Using Supabase pg_cron (if pg_cron extension is available)
-- This will run on the 1st of every month at 00:30 UTC

-- Enable pg_cron extension (requires Supabase Pro plan or self-hosted)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the monthly payout job
-- This runs on the 1st of every month at 00:30 UTC (processes previous month's commissions)
/*
SELECT cron.schedule(
  'monthly-influencer-payouts',           -- Job name
  '30 0 1 * *',                           -- Cron expression: At 00:30 on day 1 of every month
  $$
  SELECT process_monthly_influencer_payouts();
  $$
);
*/

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule the job:
-- SELECT cron.unschedule('monthly-influencer-payouts');

-- ============================================
-- OPTION 2: Using Supabase Edge Function
-- ============================================
-- If pg_cron is not available, you can create a Supabase Edge Function
-- and call it via a cron service like GitHub Actions, Vercel Cron, or cron-job.org
--
-- Edge Function path: supabase/functions/process-monthly-payouts/index.ts
--
-- Then schedule it using:
-- - GitHub Actions (runs on schedule)
-- - Vercel Cron Jobs
-- - External cron services (cron-job.org, easycron.com, etc.)
--
-- Example curl command to call the edge function:
-- curl -X POST 'https://your-project.supabase.co/functions/v1/process-monthly-payouts' \
--   -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
--   -H "Content-Type: application/json"

-- ============================================
-- MANUAL EXECUTION FOR TESTING
-- ============================================
-- To manually run the monthly payout process for testing:
-- SELECT process_monthly_influencer_payouts();

-- To payout a specific influencer:
-- SELECT payout_influencer_commission('influencer_id_here', 'admin_id_here');

-- ============================================
-- NOTES
-- ============================================
-- 1. The automatic payout will:
--    - Process all influencers with pending/approved commissions
--    - Transfer commission as wallet credit to their account
--    - Mark all sales as 'paid'
--    - Set the paid_at timestamp
--
-- 2. Influencers can then request withdrawals through the withdrawal system
--
-- 3. Admins can also manually payout commissions at any time via the admin UI
--
-- 4. All wallet credits expire after 90 days (configurable in the function)
--
-- 5. If a payout fails for an influencer, it will be logged and skipped,
--    other influencers will still be processed
