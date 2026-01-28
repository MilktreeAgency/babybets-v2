-- ============================================
-- TRIGGERS: promo_codes
-- Description: Triggers for promo_codes table
-- Dependencies: promo_codes table, update_updated_at_column function
-- ============================================

CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_promo_codes_updated_at ON public.promo_codes IS
  'Automatically updates updated_at timestamp on promo code updates';
