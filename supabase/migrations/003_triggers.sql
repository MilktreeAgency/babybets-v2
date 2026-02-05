-- ============================================
-- BABYBETS DATABASE TRIGGERS
-- Description: All database triggers
-- Version: 2.0 (Consolidated 2026-02-05)
-- ============================================

-- ============================================
-- AUTH TRIGGERS
-- ============================================

-- Auto-create profile when user signs up
-- Note: Trigger on auth.users automatically creates profile when new user signs up via Supabase auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PROFILE ROLE SYNC TRIGGER
-- ============================================

-- Sync profile role to auth.users metadata for JWT claims
CREATE TRIGGER sync_role_to_auth_on_profile_change
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_role_to_auth_metadata();

COMMENT ON TRIGGER sync_role_to_auth_on_profile_change ON public.profiles IS
  'Syncs profile role changes to auth.users metadata for JWT token claims';

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

-- Profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Competitions
CREATE TRIGGER update_competitions_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Prize Templates
CREATE TRIGGER update_prize_templates_updated_at
  BEFORE UPDATE ON public.prize_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Competition Instant Win Prizes
CREATE TRIGGER update_competition_instant_win_prizes_updated_at
  BEFORE UPDATE ON public.competition_instant_win_prizes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Wallet Credits
CREATE TRIGGER update_wallet_credits_updated_at
  BEFORE UPDATE ON public.wallet_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Promo Codes
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Prize Fulfillments
CREATE TRIGGER update_prize_fulfillments_updated_at
  BEFORE UPDATE ON public.prize_fulfillments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Influencers
CREATE TRIGGER update_influencers_updated_at
  BEFORE UPDATE ON public.influencers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Email Notifications
CREATE TRIGGER update_email_notifications_updated_at
  BEFORE UPDATE ON public.email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ORDER TRIGGERS
-- ============================================

-- Create influencer sale when order is completed
DROP TRIGGER IF EXISTS trigger_create_influencer_sale ON public.orders;

CREATE TRIGGER trigger_create_influencer_sale
  AFTER INSERT OR UPDATE OF status
  ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION create_influencer_sale();

COMMENT ON FUNCTION create_influencer_sale() IS 'Creates influencer_sales with fraud detection (blocks self-referrals)';

-- ============================================
-- INFLUENCER TRIGGERS
-- ============================================

-- Protect critical influencer fields from unauthorized modification
DROP TRIGGER IF EXISTS protect_influencer_fields_trigger ON public.influencers;

CREATE TRIGGER protect_influencer_fields_trigger
  BEFORE UPDATE ON public.influencers
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_influencer_critical_fields();

COMMENT ON FUNCTION public.protect_influencer_critical_fields IS
  'Prevents non-admin users from modifying critical system-managed fields in the influencers table';
