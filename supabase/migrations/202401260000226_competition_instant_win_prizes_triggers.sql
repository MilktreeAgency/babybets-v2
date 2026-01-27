-- ============================================
-- TRIGGERS: competition_instant_win_prizes
-- Description: Triggers for competition_instant_win_prizes table
-- Dependencies: competition_instant_win_prizes table, update_updated_at_column function
-- ============================================

CREATE TRIGGER update_competition_instant_win_prizes_updated_at
  BEFORE UPDATE ON public.competition_instant_win_prizes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_competition_instant_win_prizes_updated_at ON public.competition_instant_win_prizes IS
  'Automatically updates updated_at timestamp on competition prize updates';
