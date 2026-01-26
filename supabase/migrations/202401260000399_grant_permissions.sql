-- ============================================
-- GRANT PERMISSIONS: All tables
-- Description: Grant permissions to authenticated role for all tables
-- This must run BEFORE enabling RLS (migration 400)
-- ============================================

-- Grant all permissions to authenticated role (logged-in users)
-- RLS policies will control what they can actually see/modify

GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.competitions TO authenticated;
GRANT ALL ON public.instant_win_prizes TO authenticated;
GRANT ALL ON public.ticket_allocations TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.wallet_credits TO authenticated;
GRANT ALL ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.promo_codes TO authenticated;
GRANT ALL ON public.winners TO authenticated;
GRANT ALL ON public.prize_fulfillments TO authenticated;
GRANT ALL ON public.influencers TO authenticated;
GRANT ALL ON public.influencer_sales TO authenticated;
GRANT ALL ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.email_notifications TO authenticated;

-- Grant usage on sequences (for auto-incrementing IDs if needed)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to anon role (anonymous users) for read-only access where appropriate
GRANT SELECT ON public.competitions TO anon;
GRANT SELECT ON public.winners TO anon;

COMMENT ON SCHEMA public IS
  'Public schema with proper grants for authenticated and anon roles';
