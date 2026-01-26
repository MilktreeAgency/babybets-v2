-- ============================================
-- TRIGGERS: influencers
-- Description: Triggers for influencers table
-- Dependencies: influencers table, update_updated_at_column function
-- ============================================

CREATE TRIGGER update_influencers_updated_at
  BEFORE UPDATE ON public.influencers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_influencers_updated_at ON public.influencers IS
  'Automatically updates updated_at timestamp on influencer updates';
