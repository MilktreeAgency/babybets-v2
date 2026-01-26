-- ============================================
-- ADMIN DASHBOARD FUNCTIONS & VIEWS
-- Description: Database functions and views for admin dashboard
-- ============================================

-- ============================================
-- FUNCTION: get_dashboard_stats
-- Description: Returns KPI stats for admin dashboard
-- Returns: JSON with revenue, competitions, tickets, users stats
-- ============================================

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  current_month_start TIMESTAMPTZ;
  last_month_start TIMESTAMPTZ;
  last_month_end TIMESTAMPTZ;
  result JSON;
BEGIN
  -- Calculate date ranges
  current_month_start := date_trunc('month', NOW());
  last_month_start := date_trunc('month', NOW() - INTERVAL '1 month');
  last_month_end := date_trunc('month', NOW()) - INTERVAL '1 day';

  -- Build result JSON
  SELECT json_build_object(
    'revenue', json_build_object(
      'current', COALESCE((
        SELECT SUM(total_pence)
        FROM orders
        WHERE status = 'paid'
        AND paid_at >= current_month_start
      ), 0),
      'previous', COALESCE((
        SELECT SUM(total_pence)
        FROM orders
        WHERE status = 'paid'
        AND paid_at >= last_month_start
        AND paid_at <= last_month_end
      ), 0)
    ),
    'active_competitions', json_build_object(
      'current', COALESCE((
        SELECT COUNT(*)
        FROM competitions
        WHERE status = 'active'
      ), 0),
      'previous', COALESCE((
        SELECT COUNT(*)
        FROM competitions
        WHERE status = 'active'
        AND created_at <= last_month_end
      ), 0)
    ),
    'tickets_sold', json_build_object(
      'current', COALESCE((
        SELECT COUNT(*)
        FROM order_items
        WHERE created_at >= current_month_start
      ), 0),
      'previous', COALESCE((
        SELECT COUNT(*)
        FROM order_items
        WHERE created_at >= last_month_start
        AND created_at <= last_month_end
      ), 0)
    ),
    'total_users', json_build_object(
      'current', COALESCE((
        SELECT COUNT(*)
        FROM profiles
      ), 0),
      'previous', COALESCE((
        SELECT COUNT(*)
        FROM profiles
        WHERE created_at <= last_month_end
      ), 0)
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_dashboard_stats() IS
  'Returns dashboard KPI statistics with current and previous month comparisons';

-- Grant execute to authenticated users (will be restricted by RLS)
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;

-- ============================================
-- FUNCTION: get_recent_activities
-- Description: Returns recent activities for dashboard feed
-- Parameters: limit_count (default 10)
-- Returns: JSON array of recent activities
-- ============================================

CREATE OR REPLACE FUNCTION public.get_recent_activities(limit_count INTEGER DEFAULT 10)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH recent_orders AS (
    SELECT
      'order-' || o.id AS id,
      'order' AS type,
      'New order placed' AS title,
      'Order total: £' || ROUND(o.total_pence::NUMERIC / 100, 2) AS description,
      o.created_at AS timestamp,
      json_build_object(
        'name', COALESCE(p.first_name || ' ' || p.last_name, 'Anonymous'),
        'avatar', p.avatar_url
      ) AS user
    FROM orders o
    LEFT JOIN profiles p ON p.id = o.user_id
    WHERE o.status = 'paid'
    ORDER BY o.created_at DESC
    LIMIT 5
  ),
  recent_winners AS (
    SELECT
      'win-' || w.id AS id,
      'win' AS type,
      'Winner drawn' AS title,
      'Won: ' || COALESCE(c.title, 'Competition') AS description,
      w.created_at AS timestamp,
      json_build_object(
        'name', COALESCE(p.first_name || ' ' || p.last_name, 'Anonymous'),
        'avatar', p.avatar_url
      ) AS user
    FROM winners w
    LEFT JOIN profiles p ON p.id = w.user_id
    LEFT JOIN competitions c ON c.id = w.competition_id
    ORDER BY w.created_at DESC
    LIMIT 3
  ),
  recent_signups AS (
    SELECT
      'signup-' || p.id AS id,
      'signup' AS type,
      'New user registered' AS title,
      p.email AS description,
      p.created_at AS timestamp,
      json_build_object(
        'name', COALESCE(p.first_name || ' ' || p.last_name, 'New User'),
        'avatar', p.avatar_url
      ) AS user
    FROM profiles p
    ORDER BY p.created_at DESC
    LIMIT 3
  ),
  recent_fulfillments AS (
    SELECT
      'fulfillment-' || pf.id AS id,
      'fulfillment' AS type,
      'Prize selected' AS title,
      'Winner made prize selection' AS description,
      pf.responded_at AS timestamp,
      json_build_object(
        'name', COALESCE(p.first_name || ' ' || p.last_name, 'Anonymous'),
        'avatar', p.avatar_url
      ) AS user
    FROM prize_fulfillments pf
    LEFT JOIN profiles p ON p.id = pf.user_id
    WHERE pf.responded_at IS NOT NULL
    ORDER BY pf.responded_at DESC
    LIMIT 2
  ),
  recent_withdrawals AS (
    SELECT
      'withdrawal-' || wr.id AS id,
      'withdrawal' AS type,
      'Withdrawal requested' AS title,
      'Amount: £' || ROUND(wr.amount_pence::NUMERIC / 100, 2) AS description,
      wr.created_at AS timestamp,
      json_build_object(
        'name', COALESCE(p.first_name || ' ' || p.last_name, 'Anonymous'),
        'avatar', p.avatar_url
      ) AS user
    FROM withdrawal_requests wr
    LEFT JOIN profiles p ON p.id = wr.user_id
    ORDER BY wr.created_at DESC
    LIMIT 2
  ),
  all_activities AS (
    SELECT * FROM recent_orders
    UNION ALL
    SELECT * FROM recent_winners
    UNION ALL
    SELECT * FROM recent_signups
    UNION ALL
    SELECT * FROM recent_fulfillments
    UNION ALL
    SELECT * FROM recent_withdrawals
  )
  SELECT json_agg(activity ORDER BY timestamp DESC)
  INTO result
  FROM (
    SELECT * FROM all_activities
    ORDER BY timestamp DESC
    LIMIT limit_count
  ) AS activity;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_recent_activities(INTEGER) IS
  'Returns recent activities across orders, wins, signups, fulfillments, and withdrawals';

GRANT EXECUTE ON FUNCTION public.get_recent_activities(INTEGER) TO authenticated;

-- ============================================
-- FUNCTION: get_pending_tasks
-- Description: Returns counts of pending admin tasks
-- Returns: JSON with counts for fulfillments, withdrawals, drafts
-- ============================================

CREATE OR REPLACE FUNCTION public.get_pending_tasks()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'pending_fulfillments', COALESCE((
      SELECT COUNT(*)
      FROM prize_fulfillments
      WHERE status = 'pending'
    ), 0),
    'pending_withdrawals', COALESCE((
      SELECT COUNT(*)
      FROM withdrawal_requests
      WHERE status = 'pending'
    ), 0),
    'draft_competitions', COALESCE((
      SELECT COUNT(*)
      FROM competitions
      WHERE status = 'draft'
    ), 0)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_pending_tasks() IS
  'Returns counts of pending tasks requiring admin attention';

GRANT EXECUTE ON FUNCTION public.get_pending_tasks() TO authenticated;

-- ============================================
-- FUNCTION: get_competition_stats
-- Description: Returns detailed stats for a specific competition
-- Parameters: competition_id UUID
-- Returns: JSON with revenue, orders, tickets stats
-- ============================================

CREATE OR REPLACE FUNCTION public.get_competition_stats(competition_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_revenue', COALESCE((
      SELECT SUM(oi.unit_price_pence * oi.quantity)
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.competition_id = competition_stats.competition_id
      AND o.status = 'paid'
    ), 0),
    'total_orders', COALESCE((
      SELECT COUNT(DISTINCT o.id)
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE oi.competition_id = competition_stats.competition_id
      AND o.status = 'paid'
    ), 0),
    'tickets_sold', COALESCE((
      SELECT SUM(oi.quantity)
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.competition_id = competition_stats.competition_id
      AND o.status = 'paid'
    ), 0),
    'unique_participants', COALESCE((
      SELECT COUNT(DISTINCT o.user_id)
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE oi.competition_id = competition_stats.competition_id
      AND o.status = 'paid'
    ), 0)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_competition_stats(UUID) IS
  'Returns detailed statistics for a specific competition';

GRANT EXECUTE ON FUNCTION public.get_competition_stats(UUID) TO authenticated;
