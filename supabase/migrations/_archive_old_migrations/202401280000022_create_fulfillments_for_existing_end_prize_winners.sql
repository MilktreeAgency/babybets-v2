-- ============================================
-- MIGRATION: Create fulfillments for existing end prize winners
-- Description: Backfill prize_fulfillment records for end prize winners who don't have them yet
-- Dependencies: winners table, prize_fulfillments table
-- ============================================

-- Insert prize fulfillment records for all end prize winners who don't have one yet
INSERT INTO public.prize_fulfillments (
  user_id,
  ticket_id,
  prize_id,
  competition_id,
  status,
  value_pence,
  claim_deadline,
  notified_at,
  created_at
)
SELECT
  w.user_id,
  w.ticket_id,
  NULL, -- End prizes don't have a competition_instant_win_prize record
  w.competition_id,
  'pending' AS status,
  ROUND(COALESCE(w.prize_value_gbp, 0) * 100) AS value_pence,
  w.won_at + INTERVAL '30 days' AS claim_deadline,
  w.won_at AS notified_at,
  w.won_at AS created_at
FROM public.winners w
WHERE w.win_type = 'end_prize'
  AND w.ticket_id IS NOT NULL
  AND w.user_id IS NOT NULL
  AND w.competition_id IS NOT NULL
  -- Only create fulfillment if one doesn't exist yet
  AND NOT EXISTS (
    SELECT 1
    FROM public.prize_fulfillments pf
    WHERE pf.ticket_id = w.ticket_id
  );

-- Log the number of fulfillments created
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Created % prize fulfillment record(s) for existing end prize winners', v_count;
END $$;
