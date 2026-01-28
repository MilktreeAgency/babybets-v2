-- ============================================
-- VIEW: recent_winners_view
-- Description: Recent winners for ticker display
-- Dependencies: winners table
-- ============================================

CREATE VIEW public.recent_winners_view AS
SELECT
  id,
  display_name,
  location,
  prize_name,
  prize_value_gbp,
  prize_image_url,
  won_at
FROM public.winners
WHERE is_public = true AND show_in_ticker = true
ORDER BY won_at DESC
LIMIT 50;

COMMENT ON VIEW public.recent_winners_view IS
  'Recent winners for homepage ticker and social proof display';
