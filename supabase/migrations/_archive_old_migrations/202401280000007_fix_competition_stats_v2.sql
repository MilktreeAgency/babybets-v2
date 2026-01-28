-- ============================================
-- MIGRATION: Fix get_competition_stats function (v2)
-- Description: Fix missing FROM-clause error by using correct parameter reference
-- Dependencies: order_items table
-- ============================================

CREATE OR REPLACE FUNCTION public.get_competition_stats(competition_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_revenue', COALESCE((
      SELECT SUM(oi.total_pence)
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.competition_id = get_competition_stats.competition_id
      AND o.status = 'paid'
    ), 0),
    'total_orders', COALESCE((
      SELECT COUNT(DISTINCT o.id)
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE oi.competition_id = get_competition_stats.competition_id
      AND o.status = 'paid'
    ), 0),
    'tickets_sold', COALESCE((
      SELECT SUM(oi.ticket_count)
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.competition_id = get_competition_stats.competition_id
      AND o.status = 'paid'
    ), 0),
    'unique_participants', COALESCE((
      SELECT COUNT(DISTINCT o.user_id)
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE oi.competition_id = get_competition_stats.competition_id
      AND o.status = 'paid'
    ), 0)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_competition_stats(UUID) IS
  'Returns detailed statistics for a specific competition';
