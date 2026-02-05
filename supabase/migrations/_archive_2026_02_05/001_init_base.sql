-- ============================================
-- BABYBETS DATABASE SCHEMA - BASE INITIALIZATION
-- Description: Extensions, enums, and base utility functions
-- Version: 1.0 (Consolidated from incremental migrations)
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

COMMENT ON EXTENSION "pgcrypto" IS 'Cryptographic functions including UUID generation';

-- ============================================
-- ENUM TYPES
-- ============================================

-- Prize types
CREATE TYPE prize_type AS ENUM (
  'Physical',
  'Voucher',
  'Cash',
  'SiteCredit'
);

COMMENT ON TYPE prize_type IS 'Types of prizes that can be won';

-- Competition status
CREATE TYPE competition_status AS ENUM (
  'draft',
  'scheduled',
  'active',
  'ending_soon',
  'sold_out',
  'closed',
  'drawing',
  'drawn',
  'completed',
  'cancelled'
);

COMMENT ON TYPE competition_status IS 'Lifecycle status of a competition';

-- Competition type
CREATE TYPE competition_type AS ENUM (
  'standard',
  'instant_win',
  'instant_win_with_end_prize'
);

COMMENT ON TYPE competition_type IS 'Type of competition mechanism';

-- Competition category
CREATE TYPE competition_category AS ENUM (
  'Toys',
  'Baby & Nursery',
  'Cash',
  'Instant Wins',
  'Other'
);

COMMENT ON TYPE competition_category IS 'Competition categories for filtering and display';

-- Wallet transaction type
CREATE TYPE wallet_transaction_type AS ENUM (
  'credit',
  'debit',
  'expiry',
  'revocation',
  'withdrawal'
);

COMMENT ON TYPE wallet_transaction_type IS 'Types of wallet transactions';

-- Credit status
CREATE TYPE credit_status AS ENUM (
  'active',
  'spent',
  'expired',
  'revoked',
  'withdrawn'
);

COMMENT ON TYPE credit_status IS 'Status of wallet credits';

-- Fulfillment status
CREATE TYPE fulfillment_status AS ENUM (
  'pending',
  'prize_selected',
  'cash_selected',
  'processing',
  'dispatched',
  'delivered',
  'completed',
  'expired'
);

COMMENT ON TYPE fulfillment_status IS 'Prize fulfillment lifecycle status';

-- Promo code type
CREATE TYPE promo_code_type AS ENUM (
  'percentage',
  'fixed_value',
  'free_tickets'
);

COMMENT ON TYPE promo_code_type IS 'Type of discount for promo codes';

-- User role
CREATE TYPE user_role AS ENUM (
  'user',
  'influencer',
  'admin',
  'super_admin'
);

COMMENT ON TYPE user_role IS 'User role for access control';

-- Order status
CREATE TYPE order_status AS ENUM (
  'pending',
  'paid',
  'failed',
  'refunded',
  'cancelled'
);

COMMENT ON TYPE order_status IS 'Order payment and processing status';

-- ============================================
-- BASE UTILITY FUNCTIONS
-- ============================================

-- Automatically update updated_at timestamp on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS
  'Trigger function to automatically update updated_at timestamp';

-- Check if current user has admin or super_admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'role')::text IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin IS
  'Returns true if current user is admin or super_admin. Queries auth.users to avoid RLS issues.';

-- Check if current user has influencer role
CREATE OR REPLACE FUNCTION public.is_influencer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'role')::text = 'influencer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_influencer IS
  'Returns true if current user is an influencer. Queries auth.users to avoid RLS issues.';
