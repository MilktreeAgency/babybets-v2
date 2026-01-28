-- ============================================
-- TRIGGERS: wallet_credits
-- Description: Triggers for wallet_credits table
-- Dependencies: wallet_credits table, update_updated_at_column function
-- ============================================

CREATE TRIGGER update_wallet_credits_updated_at
  BEFORE UPDATE ON public.wallet_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_wallet_credits_updated_at ON public.wallet_credits IS
  'Automatically updates updated_at timestamp on wallet credit updates';
