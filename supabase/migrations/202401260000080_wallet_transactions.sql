-- ============================================
-- TABLE: wallet_transactions
-- Description: Wallet transaction ledger
-- Dependencies: profiles, wallet_credits, orders
-- ============================================

CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  credit_id UUID REFERENCES public.wallet_credits(id),

  -- Transaction details
  type wallet_transaction_type NOT NULL,
  amount_pence INTEGER NOT NULL,
  balance_after_pence INTEGER NOT NULL,

  -- References
  order_id UUID REFERENCES public.orders(id),

  -- Description
  description TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_wallet_transactions_user ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_credit ON public.wallet_transactions(credit_id);
CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_transactions_type ON public.wallet_transactions(type);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.wallet_transactions IS 'Immutable ledger of all wallet transactions';
COMMENT ON COLUMN public.wallet_transactions.type IS 'Transaction type: credit, debit, expiry, revocation, withdrawal';
COMMENT ON COLUMN public.wallet_transactions.amount_pence IS 'Transaction amount in pence (positive for credit, negative for debit)';
COMMENT ON COLUMN public.wallet_transactions.balance_after_pence IS 'User wallet balance after this transaction';
