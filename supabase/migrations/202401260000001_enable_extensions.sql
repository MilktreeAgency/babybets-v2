-- ============================================
-- MIGRATION: 001_enable_extensions
-- Description: Enable required PostgreSQL extensions
-- Dependencies: None
-- ============================================

-- Cryptographic functions (includes gen_random_uuid())
-- Note: pgcrypto is enabled by default in Supabase
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Comments
COMMENT ON EXTENSION "pgcrypto" IS 'Cryptographic functions including UUID generation';
