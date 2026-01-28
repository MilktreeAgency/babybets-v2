-- ============================================
-- TABLE: orders
-- Description: Customer orders for ticket purchases
-- Dependencies: profiles, promo_codes (forward reference)
-- ============================================

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),

  -- Order details
  status order_status DEFAULT 'pending',

  -- Amounts in pence
  subtotal_pence INTEGER NOT NULL,
  discount_pence INTEGER DEFAULT 0,
  credit_applied_pence INTEGER DEFAULT 0,
  total_pence INTEGER NOT NULL,

  -- Promo code (forward reference - table created later)
  promo_code_id UUID,
  promo_code_value TEXT,

  -- Influencer tracking
  influencer_id UUID REFERENCES public.profiles(id),
  influencer_code TEXT,

  -- Payment
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  paid_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_influencer ON public.orders(influencer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_stripe_payment_intent ON public.orders(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.orders IS 'Customer orders for ticket purchases';
COMMENT ON COLUMN public.orders.subtotal_pence IS 'Order subtotal before discounts in pence';
COMMENT ON COLUMN public.orders.discount_pence IS 'Promo code discount amount in pence';
COMMENT ON COLUMN public.orders.credit_applied_pence IS 'Wallet credit applied in pence';
COMMENT ON COLUMN public.orders.total_pence IS 'Final order total in pence';
COMMENT ON COLUMN public.orders.influencer_code IS 'Influencer/affiliate code used for tracking';
