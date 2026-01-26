-- ============================================
-- TABLE: prize_fulfillments
-- Description: Prize fulfillment tracking and delivery
-- Dependencies: profiles, ticket_allocations, instant_win_prizes, competitions
-- ============================================

CREATE TABLE public.prize_fulfillments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  ticket_id UUID NOT NULL REFERENCES public.ticket_allocations(id),
  prize_id UUID NOT NULL REFERENCES public.instant_win_prizes(id),
  competition_id UUID NOT NULL REFERENCES public.competitions(id),

  -- Status
  status fulfillment_status DEFAULT 'pending',

  -- Choice (for prizes with cash alternative)
  choice TEXT,
  value_pence INTEGER NOT NULL,

  -- Deadlines
  claim_deadline TIMESTAMPTZ NOT NULL,

  -- Tracking
  notified_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Delivery info
  tracking_number TEXT,
  delivery_address JSONB,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_prize_fulfillments_user ON public.prize_fulfillments(user_id);
CREATE INDEX idx_prize_fulfillments_status ON public.prize_fulfillments(status);
CREATE INDEX idx_prize_fulfillments_pending ON public.prize_fulfillments(status, claim_deadline)
  WHERE status = 'pending';
CREATE INDEX idx_prize_fulfillments_competition ON public.prize_fulfillments(competition_id);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.prize_fulfillments IS 'Prize fulfillment tracking and delivery management';
COMMENT ON COLUMN public.prize_fulfillments.choice IS 'Winner choice: prize or cash (for prizes with cash alternative)';
COMMENT ON COLUMN public.prize_fulfillments.value_pence IS 'Value of prize or cash alternative in pence';
COMMENT ON COLUMN public.prize_fulfillments.claim_deadline IS 'Deadline for winner to respond and claim prize';
COMMENT ON COLUMN public.prize_fulfillments.delivery_address IS 'JSON object with delivery address details';
