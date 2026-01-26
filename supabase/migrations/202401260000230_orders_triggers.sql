-- ============================================
-- TRIGGERS: orders
-- Description: Triggers for orders table
-- Dependencies: orders table, update_updated_at_column function
-- ============================================

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_orders_updated_at ON public.orders IS
  'Automatically updates updated_at timestamp on order updates';
