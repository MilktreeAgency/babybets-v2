-- ============================================
-- BABYBETS DATABASE SCHEMA - GRANTS
-- Description: Permission grants for functions and tables
-- Version: 1.0 (Consolidated from incremental migrations)
-- ============================================

-- ============================================
-- TABLE GRANTS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant access to all tables for authenticated users (RLS will control row-level access)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant access to all sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- ============================================
-- FUNCTION GRANTS
-- ============================================

-- Wallet management functions
GRANT EXECUTE ON FUNCTION public.debit_wallet_credits(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_order_with_wallet(UUID, UUID) TO authenticated;

-- Prize allocation functions
GRANT EXECUTE ON FUNCTION public.allocate_instant_win_prize(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_cash_alternative(UUID, UUID) TO authenticated;

-- Draw execution functions
GRANT EXECUTE ON FUNCTION public.execute_competition_draw(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_draw_integrity(UUID) TO public, anon, authenticated;

-- Admin dashboard functions
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_competition_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_tasks() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_activities(INTEGER) TO authenticated;

-- User management functions
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;

-- ============================================
-- DEFAULT PRIVILEGES
-- ============================================

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated, anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated;
