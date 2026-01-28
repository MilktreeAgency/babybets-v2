-- ============================================
-- TRIGGERS: competitions
-- Description: Triggers for competitions table
-- Dependencies: competitions table, update_updated_at_column function
-- ============================================

CREATE TRIGGER update_competitions_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_competitions_updated_at ON public.competitions IS
  'Automatically updates updated_at timestamp on competition updates';
