-- ============================================
-- TABLE: influencer_sales
-- Description: Commission tracking for influencer sales
-- Dependencies: influencers, orders
-- ============================================

CREATE TABLE public.influencer_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES public.influencers(id),
  order_id UUID NOT NULL REFERENCES public.orders(id),

  -- Amounts
  order_value_pence INTEGER NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL,
  commission_pence INTEGER NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_influencer_sales_influencer ON public.influencer_sales(influencer_id);
CREATE INDEX idx_influencer_sales_order ON public.influencer_sales(order_id);
CREATE INDEX idx_influencer_sales_status ON public.influencer_sales(status);
CREATE INDEX idx_influencer_sales_created_at ON public.influencer_sales(created_at DESC);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.influencer_sales IS 'Commission tracking for influencer-attributed sales';
COMMENT ON COLUMN public.influencer_sales.commission_rate IS 'Commission rate as decimal (e.g., 0.1500 for 15%)';
COMMENT ON COLUMN public.influencer_sales.status IS 'Status: pending, approved, paid, or cancelled';
COMMENT ON COLUMN public.influencer_sales.paid_at IS 'Timestamp when commission was paid to influencer';
