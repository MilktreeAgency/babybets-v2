-- ============================================
-- TABLE: ticket_allocations
-- Description: Pre-generated ticket pool with prize allocations
-- Dependencies: competitions, competition_instant_win_prizes, profiles
-- ============================================

CREATE TABLE public.ticket_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL,

  -- Prize allocation (null = no instant win)
  prize_id UUID,  -- FK added in migration 157

  -- Claim tracking
  is_sold BOOLEAN DEFAULT false,
  sold_at TIMESTAMPTZ,
  sold_to_user_id UUID REFERENCES public.profiles(id),
  order_id UUID,

  -- Reveal tracking (for instant wins)
  is_revealed BOOLEAN DEFAULT false,
  revealed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(competition_id, ticket_number)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_ticket_allocations_competition ON public.ticket_allocations(competition_id);
CREATE INDEX idx_ticket_allocations_user ON public.ticket_allocations(sold_to_user_id);
CREATE INDEX idx_ticket_allocations_order ON public.ticket_allocations(order_id);
CREATE INDEX idx_ticket_allocations_unsold ON public.ticket_allocations(competition_id)
  WHERE is_sold = false;
CREATE INDEX idx_ticket_allocations_unrevealed ON public.ticket_allocations(sold_to_user_id)
  WHERE is_sold = true AND is_revealed = false;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.ticket_allocations IS 'Pre-generated ticket pool with instant win prize allocations';
COMMENT ON COLUMN public.ticket_allocations.ticket_number IS '7-digit unique ticket code';
COMMENT ON COLUMN public.ticket_allocations.prize_id IS 'Reference to competition instant win prize (null = no instant win)';
COMMENT ON COLUMN public.ticket_allocations.is_revealed IS 'True when user has revealed/scratched the ticket';
