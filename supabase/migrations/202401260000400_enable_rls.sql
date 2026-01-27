-- ============================================
-- MIGRATION: 400_enable_rls
-- Description: Enable Row Level Security on all tables
-- Dependencies: All tables
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_instant_win_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.profiles IS 'RLS enabled - Users can only see/edit their own profile, admins can see all';
COMMENT ON TABLE public.competitions IS 'RLS enabled - Public can view active, admins can manage all';
COMMENT ON TABLE public.prize_templates IS 'RLS enabled - Public can view active prizes, admins can manage all';
COMMENT ON TABLE public.competition_instant_win_prizes IS 'RLS enabled - Public can view for active competitions, admins can manage all';
COMMENT ON TABLE public.ticket_allocations IS 'RLS enabled - Users can only see their own tickets, admins can see all';
COMMENT ON TABLE public.orders IS 'RLS enabled - Users can only see their own orders, admins/influencers have special access';
COMMENT ON TABLE public.order_items IS 'RLS enabled - Access follows parent order policies';
COMMENT ON TABLE public.wallet_credits IS 'RLS enabled - Users can only see their own credits, admins can see all';
COMMENT ON TABLE public.wallet_transactions IS 'RLS enabled - Users can only see their own transactions, admins can see all';
COMMENT ON TABLE public.promo_codes IS 'RLS enabled - Public can validate active codes, admins can manage all';
COMMENT ON TABLE public.winners IS 'RLS enabled - Public can view public winners, admins can manage all';
COMMENT ON TABLE public.prize_fulfillments IS 'RLS enabled - Users can see/update their own fulfillments, admins can manage all';
COMMENT ON TABLE public.influencers IS 'RLS enabled - Public can view active, influencers can edit their own, admins can manage all';
COMMENT ON TABLE public.influencer_sales IS 'RLS enabled - Influencers can view their own sales, admins can manage all';
COMMENT ON TABLE public.withdrawal_requests IS 'RLS enabled - Users can create/view their own requests, admins can manage all';
COMMENT ON TABLE public.email_notifications IS 'RLS enabled - Admin access only';
