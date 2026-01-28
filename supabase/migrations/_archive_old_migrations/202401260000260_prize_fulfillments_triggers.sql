-- ============================================
-- TRIGGERS: prize_fulfillments
-- Description: Triggers for prize_fulfillments table
-- Dependencies: prize_fulfillments table, update_updated_at_column function
-- ============================================

CREATE TRIGGER update_prize_fulfillments_updated_at
  BEFORE UPDATE ON public.prize_fulfillments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_prize_fulfillments_updated_at ON public.prize_fulfillments IS
  'Automatically updates updated_at timestamp on fulfillment updates';
