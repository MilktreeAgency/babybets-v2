-- ============================================
-- TRIGGERS: prize_templates
-- Description: Triggers for prize_templates table
-- Dependencies: prize_templates table, update_updated_at_column function
-- ============================================

CREATE TRIGGER update_prize_templates_updated_at
  BEFORE UPDATE ON public.prize_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_prize_templates_updated_at ON public.prize_templates IS
  'Automatically updates updated_at timestamp on prize template updates';
