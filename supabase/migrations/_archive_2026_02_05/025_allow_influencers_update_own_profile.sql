-- ============================================
-- ALLOW INFLUENCERS TO UPDATE OWN PROFILE
-- Description: Add RLS policy so influencers can edit their profile information
-- Version: 1.0
-- ============================================

-- Allow influencers to update their own profile data
CREATE POLICY "Influencers can update own profile"
ON public.influencers FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  -- Prevent influencers from changing critical fields
  AND is_active = (SELECT is_active FROM public.influencers WHERE user_id = auth.uid())
  AND commission_tier = (SELECT commission_tier FROM public.influencers WHERE user_id = auth.uid())
  AND slug = (SELECT slug FROM public.influencers WHERE user_id = auth.uid())
);

COMMENT ON POLICY "Influencers can update own profile" ON public.influencers IS
  'Allows influencers to update their profile information (display_name, bio, page_bio, social_profile_url, images) but prevents them from changing critical fields like is_active, commission_tier, and slug';
