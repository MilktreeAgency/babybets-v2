-- ============================================
-- BABYBETS DATABASE SCHEMA - RLS POLICIES
-- Description: Row Level Security policies for all tables
-- Version: 1.0 (Consolidated from incremental migrations)
-- ============================================

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_instant_win_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================
-- COMPETITIONS POLICIES
-- ============================================

CREATE POLICY "Anyone can view active competitions"
ON public.competitions FOR SELECT
TO public
USING (
  status IN ('active', 'ending_soon', 'sold_out', 'closed', 'drawn', 'completed')
);

CREATE POLICY "Admins can view all competitions"
ON public.competitions FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert competitions"
ON public.competitions FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update competitions"
ON public.competitions FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete competitions"
ON public.competitions FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================
-- PRIZE TEMPLATES POLICIES
-- ============================================

CREATE POLICY "Anyone can view active prize templates"
ON public.prize_templates FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can view all prize templates"
ON public.prize_templates FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert prize templates"
ON public.prize_templates FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update prize templates"
ON public.prize_templates FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete prize templates"
ON public.prize_templates FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================
-- COMPETITION INSTANT WIN PRIZES POLICIES
-- ============================================

CREATE POLICY "Anyone can view prizes for active competitions"
ON public.competition_instant_win_prizes FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.competitions c
    WHERE c.id = competition_id
    AND c.status IN ('active', 'ending_soon', 'sold_out', 'closed', 'drawn', 'completed')
  )
);

CREATE POLICY "Admins can view all competition prizes"
ON public.competition_instant_win_prizes FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert competition prizes"
ON public.competition_instant_win_prizes FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update competition prizes"
ON public.competition_instant_win_prizes FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete competition prizes"
ON public.competition_instant_win_prizes FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================
-- PROMO CODES POLICIES
-- ============================================

CREATE POLICY "Anyone can view active promo codes"
ON public.promo_codes FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can view all promo codes"
ON public.promo_codes FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert promo codes"
ON public.promo_codes FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update promo codes"
ON public.promo_codes FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete promo codes"
ON public.promo_codes FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================
-- ORDERS POLICIES
-- ============================================

CREATE POLICY "Users can view own orders"
ON public.orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create own orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending orders"
ON public.orders FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update all orders"
ON public.orders FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Influencers can view attributed orders"
ON public.orders FOR SELECT
TO authenticated
USING (influencer_id = auth.uid());

-- ============================================
-- ORDER ITEMS POLICIES
-- ============================================

CREATE POLICY "Users can view items from their orders"
ON public.order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id
    AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all order items"
ON public.order_items FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert order items"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Users can insert items for their own orders"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id
    AND o.user_id = auth.uid()
    AND o.status = 'pending'
  )
);

CREATE POLICY "Admins can update order items"
ON public.order_items FOR UPDATE
TO authenticated
USING (public.is_admin());

-- ============================================
-- TICKET ALLOCATIONS POLICIES
-- ============================================

CREATE POLICY "Users can view their own allocated tickets"
ON public.ticket_allocations FOR SELECT
TO authenticated
USING (sold_to_user_id = auth.uid());

CREATE POLICY "Users can update their own tickets"
ON public.ticket_allocations FOR UPDATE
TO authenticated
USING (sold_to_user_id = auth.uid())
WITH CHECK (sold_to_user_id = auth.uid());

CREATE POLICY "Admins can view all tickets"
ON public.ticket_allocations FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert tickets"
ON public.ticket_allocations FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all tickets"
ON public.ticket_allocations FOR UPDATE
TO authenticated
USING (public.is_admin());

-- ============================================
-- WALLET CREDITS POLICIES
-- ============================================

CREATE POLICY "Users can view own credits"
ON public.wallet_credits FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all credits"
ON public.wallet_credits FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert credits"
ON public.wallet_credits FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update credits"
ON public.wallet_credits FOR UPDATE
TO authenticated
USING (public.is_admin());

-- ============================================
-- WALLET TRANSACTIONS POLICIES
-- ============================================

CREATE POLICY "Users can view own transactions"
ON public.wallet_transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions"
ON public.wallet_transactions FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert transactions"
ON public.wallet_transactions FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- ============================================
-- WINNERS POLICIES
-- ============================================

CREATE POLICY "Anyone can view public winners"
ON public.winners FOR SELECT
TO public
USING (is_public = true);

CREATE POLICY "Users can view own winners"
ON public.winners FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all winners"
ON public.winners FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert winners"
ON public.winners FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update winners"
ON public.winners FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete winners"
ON public.winners FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================
-- PRIZE FULFILLMENTS POLICIES
-- ============================================

CREATE POLICY "Users can view own fulfillments"
ON public.prize_fulfillments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own pending fulfillments"
ON public.prize_fulfillments FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all fulfillments"
ON public.prize_fulfillments FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert fulfillments"
ON public.prize_fulfillments FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update fulfillments"
ON public.prize_fulfillments FOR UPDATE
TO authenticated
USING (public.is_admin());

-- ============================================
-- INFLUENCERS POLICIES
-- ============================================

CREATE POLICY "Anyone can view active influencer profiles"
ON public.influencers FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Influencers can view own profile"
ON public.influencers FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all influencers"
ON public.influencers FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert influencers"
ON public.influencers FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update influencers"
ON public.influencers FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete influencers"
ON public.influencers FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================
-- INFLUENCER SALES POLICIES
-- ============================================

CREATE POLICY "Influencers can view own sales"
ON public.influencer_sales FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.influencers i
    WHERE i.id = influencer_id
    AND i.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all influencer sales"
ON public.influencer_sales FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert influencer sales"
ON public.influencer_sales FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update influencer sales"
ON public.influencer_sales FOR UPDATE
TO authenticated
USING (public.is_admin());

-- ============================================
-- WITHDRAWAL REQUESTS POLICIES
-- ============================================

CREATE POLICY "Users can view own withdrawal requests"
ON public.withdrawal_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create withdrawal requests"
ON public.withdrawal_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all withdrawal requests"
ON public.withdrawal_requests FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update withdrawal requests"
ON public.withdrawal_requests FOR UPDATE
TO authenticated
USING (public.is_admin());

-- ============================================
-- EMAIL NOTIFICATIONS POLICIES
-- ============================================

CREATE POLICY "Users can view own notifications"
ON public.email_notifications FOR SELECT
TO authenticated
USING (recipient_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can view all notifications"
ON public.email_notifications FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert notifications"
ON public.email_notifications FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update notifications"
ON public.email_notifications FOR UPDATE
TO authenticated
USING (public.is_admin());

-- ============================================
-- DRAW SYSTEM POLICIES
-- ============================================

-- Draw Snapshots
CREATE POLICY "Public can view draw snapshots for completed competitions"
ON public.draw_snapshots FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.competitions c
    WHERE c.id = competition_id
    AND c.status IN ('drawn', 'completed')
  )
);

CREATE POLICY "Admins can view all draw snapshots"
ON public.draw_snapshots FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert draw snapshots"
ON public.draw_snapshots FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Draws
CREATE POLICY "Public can view draws for completed competitions"
ON public.draws FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.competitions c
    WHERE c.id = competition_id
    AND c.status IN ('drawn', 'completed')
  )
);

CREATE POLICY "Admins can view all draws"
ON public.draws FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert draws"
ON public.draws FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update draws"
ON public.draws FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Draw Audit Log
CREATE POLICY "Admins can view draw audit logs"
ON public.draw_audit_log FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert draw audit logs"
ON public.draw_audit_log FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());
