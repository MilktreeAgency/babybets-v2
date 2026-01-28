-- ============================================
-- TABLE: order_items
-- Description: Line items within orders
-- Dependencies: orders, competitions
-- ============================================

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.competitions(id),

  -- Ticket details
  ticket_count INTEGER NOT NULL,
  price_per_ticket_pence INTEGER NOT NULL,
  total_pence INTEGER NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_competition ON public.order_items(competition_id);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.order_items IS 'Line items representing competition entries within orders';
COMMENT ON COLUMN public.order_items.ticket_count IS 'Number of tickets purchased for this competition';
COMMENT ON COLUMN public.order_items.price_per_ticket_pence IS 'Price per ticket in pence (tiered pricing)';
COMMENT ON COLUMN public.order_items.total_pence IS 'Total for this line item in pence';
