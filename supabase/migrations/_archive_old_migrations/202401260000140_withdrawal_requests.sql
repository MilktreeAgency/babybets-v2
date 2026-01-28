-- ============================================
-- TABLE: withdrawal_requests
-- Description: User wallet withdrawal requests
-- Dependencies: profiles
-- ============================================

CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),

  -- Amount
  amount_pence INTEGER NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending',

  -- Bank details
  bank_details JSONB,
  bank_sort_code TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,

  -- Admin
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_withdrawal_requests_user ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_pending ON public.withdrawal_requests(status, created_at)
  WHERE status = 'pending';
CREATE INDEX idx_withdrawal_requests_created_at ON public.withdrawal_requests(created_at DESC);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.withdrawal_requests IS 'User wallet withdrawal requests and admin approval tracking';
COMMENT ON COLUMN public.withdrawal_requests.status IS 'Status: pending, approved, rejected, or paid';
COMMENT ON COLUMN public.withdrawal_requests.bank_sort_code IS 'UK bank sort code (format: XX-XX-XX)';
COMMENT ON COLUMN public.withdrawal_requests.bank_account_number IS 'UK bank account number (8 digits)';
COMMENT ON COLUMN public.withdrawal_requests.bank_account_name IS 'Name on the bank account';
