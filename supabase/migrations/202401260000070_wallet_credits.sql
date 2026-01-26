-- ============================================
-- TABLE: wallet_credits
-- Description: User wallet credits (site credit)
-- Dependencies: profiles, competitions, ticket_allocations, instant_win_prizes, orders
-- ============================================

CREATE TABLE public.wallet_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),

  -- Amounts
  amount_pence INTEGER NOT NULL,
  remaining_pence INTEGER NOT NULL,
  status credit_status DEFAULT 'active',

  -- Source tracking
  source_type TEXT NOT NULL,
  source_competition_id UUID REFERENCES public.competitions(id),
  source_ticket_id UUID REFERENCES public.ticket_allocations(id),
  source_order_id UUID REFERENCES public.orders(id),
  source_prize_id UUID REFERENCES public.instant_win_prizes(id),

  -- Description
  description TEXT NOT NULL,

  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_wallet_credits_user ON public.wallet_credits(user_id);
CREATE INDEX idx_wallet_credits_active ON public.wallet_credits(user_id, status)
  WHERE status = 'active';
CREATE INDEX idx_wallet_credits_expiring ON public.wallet_credits(user_id, expires_at)
  WHERE status = 'active';
CREATE INDEX idx_wallet_credits_source_type ON public.wallet_credits(source_type);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.wallet_credits IS 'User wallet credits (site credit) with expiry tracking';
COMMENT ON COLUMN public.wallet_credits.amount_pence IS 'Original credit amount in pence';
COMMENT ON COLUMN public.wallet_credits.remaining_pence IS 'Remaining credit amount in pence';
COMMENT ON COLUMN public.wallet_credits.source_type IS 'Source: instant_win, promo, refund, manual, referral';
COMMENT ON COLUMN public.wallet_credits.expires_at IS 'Credit expiration date';
