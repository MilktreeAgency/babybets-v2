-- ============================================
-- ADD: avatar_url to profiles
-- Description: Store user avatar from OAuth providers
-- ============================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN public.profiles.avatar_url IS 'User avatar URL from OAuth provider or uploaded image';
