-- ============================================
-- GRANT SERVICE ROLE PERMISSIONS
-- Description: Grant service role access to all tables for edge functions
-- Created: 2026-02-05
-- ============================================

-- Grant full access to all tables for service_role (edge functions)
-- Service role bypasses RLS but still needs GRANT permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant access to all sequences for service_role
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant execute on all functions for service_role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Set default privileges for future objects created by postgres role
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO service_role;

COMMENT ON SCHEMA public IS
  'Standard public schema with full service_role access for edge functions';
