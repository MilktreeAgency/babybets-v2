-- ============================================
-- VIEW: active_competitions_view
-- Description: Active competitions with instant win prize counts
-- Dependencies: competitions, competition_instant_win_prizes tables
-- ============================================

CREATE VIEW public.active_competitions_view AS
SELECT
  c.*,
  COALESCE(p.total_prizes, 0) as total_instant_win_prizes,
  COALESCE(p.remaining_prizes, 0) as remaining_instant_win_prizes
FROM public.competitions c
LEFT JOIN (
  SELECT
    competition_id,
    SUM(total_quantity) as total_prizes,
    SUM(remaining_quantity) as remaining_prizes
  FROM public.competition_instant_win_prizes
  GROUP BY competition_id
) p ON c.id = p.competition_id
WHERE c.status IN ('active', 'ending_soon');

COMMENT ON VIEW public.active_competitions_view IS
  'Active competitions with aggregated instant win prize counts for efficient querying';
