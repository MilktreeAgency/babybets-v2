-- ============================================
-- BABYBETS DATABASE SCHEMA - VIEWS
-- Description: All view definitions for optimized queries
-- Version: 1.0 (Consolidated from incremental migrations)
-- ============================================

-- ============================================
-- VIEW: active_competitions_view
-- Description: Active competitions with instant win prize counts
-- ============================================

CREATE OR REPLACE VIEW public.active_competitions_view AS
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
  'Active competitions with aggregated instant win prize counts for performance';

-- ============================================
-- VIEW: wallet_balance_view
-- Description: User wallet balances with expiry info
-- ============================================

CREATE OR REPLACE VIEW public.wallet_balance_view AS
SELECT
  user_id,
  SUM(remaining_pence) FILTER (
    WHERE status = 'active' AND expires_at > NOW()
  ) as available_balance_pence,
  SUM(remaining_pence) FILTER (
    WHERE status = 'active'
    AND expires_at > NOW()
    AND expires_at <= NOW() + INTERVAL '7 days'
  ) as expiring_soon_pence,
  MIN(expires_at) FILTER (
    WHERE status = 'active' AND expires_at > NOW()
  ) as next_expiry_date
FROM public.wallet_credits
GROUP BY user_id;

COMMENT ON VIEW public.wallet_balance_view IS
  'User wallet balances with available, expiring soon, and next expiry information';

-- ============================================
-- VIEW: recent_winners_view
-- Description: Recent public winners for homepage ticker
-- ============================================

CREATE OR REPLACE VIEW public.recent_winners_view AS
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
  'Recent public winners for homepage ticker display, limited to 50 most recent';
