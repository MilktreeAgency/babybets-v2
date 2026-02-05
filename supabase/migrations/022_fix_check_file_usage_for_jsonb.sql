-- Fix check_file_usage to also check JSONB arrays for image URLs
-- This fixes the issue where competition images in the images[] array weren't being detected

CREATE OR REPLACE FUNCTION public.check_file_usage(file_url TEXT)
RETURNS TABLE (
  table_name TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  -- Check profiles.avatar_url
  SELECT 'profiles'::TEXT, COUNT(*)::BIGINT
  FROM public.profiles
  WHERE avatar_url = file_url

  UNION ALL

  -- Check competitions.image_url (main image)
  SELECT 'competitions_main'::TEXT, COUNT(*)::BIGINT
  FROM public.competitions
  WHERE image_url = file_url

  UNION ALL

  -- Check competitions.images JSONB array (multiple images)
  SELECT 'competitions_gallery'::TEXT, COUNT(*)::BIGINT
  FROM public.competitions
  WHERE images::text LIKE '%' || file_url || '%'

  UNION ALL

  -- Check prize_templates.image_url
  SELECT 'prize_templates'::TEXT, COUNT(*)::BIGINT
  FROM public.prize_templates
  WHERE image_url = file_url

  UNION ALL

  -- Check winners.prize_image_url
  SELECT 'winners_prize'::TEXT, COUNT(*)::BIGINT
  FROM public.winners
  WHERE prize_image_url = file_url

  UNION ALL

  -- Check winners.winner_photo_url
  SELECT 'winners_photo'::TEXT, COUNT(*)::BIGINT
  FROM public.winners
  WHERE winner_photo_url = file_url

  UNION ALL

  -- Check influencers.profile_image_url
  SELECT 'influencers_profile'::TEXT, COUNT(*)::BIGINT
  FROM public.influencers
  WHERE profile_image_url = file_url

  UNION ALL

  -- Check influencers.page_image_url
  SELECT 'influencers_page'::TEXT, COUNT(*)::BIGINT
  FROM public.influencers
  WHERE page_image_url = file_url;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.check_file_usage IS 'Check if a file URL is used in any table including JSONB arrays - returns all table usage counts in a single query';
