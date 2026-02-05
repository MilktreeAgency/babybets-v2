-- Function to check if a file URL is in use across all tables
-- Returns a single result with all usage information
CREATE OR REPLACE FUNCTION public.check_file_usage(file_url TEXT)
RETURNS TABLE (
  table_name TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'profiles'::TEXT, COUNT(*)::BIGINT
  FROM public.profiles
  WHERE avatar_url = file_url

  UNION ALL

  SELECT 'competitions'::TEXT, COUNT(*)::BIGINT
  FROM public.competitions
  WHERE image_url = file_url

  UNION ALL

  SELECT 'prize_templates'::TEXT, COUNT(*)::BIGINT
  FROM public.prize_templates
  WHERE image_url = file_url

  UNION ALL

  SELECT 'winners_prize'::TEXT, COUNT(*)::BIGINT
  FROM public.winners
  WHERE prize_image_url = file_url

  UNION ALL

  SELECT 'winners_photo'::TEXT, COUNT(*)::BIGINT
  FROM public.winners
  WHERE winner_photo_url = file_url

  UNION ALL

  SELECT 'influencers_profile'::TEXT, COUNT(*)::BIGINT
  FROM public.influencers
  WHERE profile_image_url = file_url

  UNION ALL

  SELECT 'influencers_page'::TEXT, COUNT(*)::BIGINT
  FROM public.influencers
  WHERE page_image_url = file_url;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.check_file_usage IS 'Check if a file URL is used in any table - returns all table usage counts in a single query';
