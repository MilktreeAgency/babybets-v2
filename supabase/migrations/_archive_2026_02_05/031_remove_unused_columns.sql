-- ============================================
-- REMOVE UNUSED COLUMNS FROM TABLES
-- Description: Clean up columns that are not being used in the application
-- Version: 1.0
-- ============================================

-- ============================================
-- PART 1: REMOVE UNUSED COLUMNS FROM INFLUENCERS TABLE
-- ============================================

-- Drop featured_competition_id (not used in UI or backend)
ALTER TABLE public.influencers
DROP COLUMN IF EXISTS featured_competition_id;

-- Drop social_links (not used in UI or backend)
ALTER TABLE public.influencers
DROP COLUMN IF EXISTS social_links;

COMMENT ON TABLE public.influencers IS 'Influencer and partner profiles with commission tracking (cleaned up unused columns)';

-- ============================================
-- PART 2: REMOVE UNUSED COLUMNS FROM ORDERS TABLE
-- ============================================

-- Drop stripe_payment_intent_id (not actively used)
ALTER TABLE public.orders
DROP COLUMN IF EXISTS stripe_payment_intent_id;

-- Drop stripe_checkout_session_id (not actively used)
ALTER TABLE public.orders
DROP COLUMN IF EXISTS stripe_checkout_session_id;

COMMENT ON TABLE public.orders IS 'Customer orders for ticket purchases (removed unused Stripe tracking columns)';

-- ============================================
-- PART 3: REMOVE UNUSED COLUMNS FROM PROFILES TABLE
-- ============================================

-- Drop referral system columns (not implemented)
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS referred_by;

ALTER TABLE public.profiles
DROP COLUMN IF EXISTS referral_code;

-- Drop related indexes
DROP INDEX IF EXISTS idx_profiles_referral_code;

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth (removed unused referral system)';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Summary:
--   Removed from influencers:
--     - featured_competition_id
--     - social_links
--
--   Removed from orders:
--     - stripe_payment_intent_id
--     - stripe_checkout_session_id
--
--   Removed from profiles:
--     - referred_by
--     - referral_code
--     - idx_profiles_referral_code (index)
-- ============================================
