-- ============================================
-- TRIGGERS: profiles
-- Description: Triggers for profiles table
-- Dependencies: profiles table, update_updated_at_column function
-- ============================================

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_profiles_updated_at ON public.profiles IS
  'Automatically updates updated_at timestamp on profile updates';
