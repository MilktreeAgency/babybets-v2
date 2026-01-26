-- ============================================
-- TRIGGERS: instant_win_prizes
-- Description: Triggers for instant_win_prizes table
-- Dependencies: instant_win_prizes table, update_updated_at_column function
-- ============================================

CREATE TRIGGER update_instant_win_prizes_updated_at
  BEFORE UPDATE ON public.instant_win_prizes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_instant_win_prizes_updated_at ON public.instant_win_prizes IS
  'Automatically updates updated_at timestamp on prize updates';
