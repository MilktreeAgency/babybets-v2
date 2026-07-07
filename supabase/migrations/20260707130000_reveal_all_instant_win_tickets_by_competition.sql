-- Scope bulk reveal to a single competition when p_competition_id is provided

DROP FUNCTION IF EXISTS public.reveal_all_instant_win_tickets(UUID);

CREATE OR REPLACE FUNCTION public.reveal_all_instant_win_tickets(
  p_user_id UUID,
  p_competition_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket RECORD;
  v_revealed_count INTEGER := 0;
  v_prizes_allocated INTEGER := 0;
  v_allocation JSONB;
BEGIN
  IF p_user_id IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.ticket_allocations ta
  SET
    is_revealed = true,
    revealed_at = NOW()
  FROM public.competitions c
  WHERE ta.competition_id = c.id
    AND c.competition_type = 'instant_win'::competition_type
    AND ta.sold_to_user_id = p_user_id
    AND COALESCE(ta.is_revealed, false) = false
    AND (p_competition_id IS NULL OR ta.competition_id = p_competition_id);

  GET DIAGNOSTICS v_revealed_count = ROW_COUNT;

  FOR v_ticket IN
    SELECT ta.id
    FROM public.ticket_allocations ta
    INNER JOIN public.competitions c ON c.id = ta.competition_id
    WHERE ta.sold_to_user_id = p_user_id
      AND c.competition_type = 'instant_win'::competition_type
      AND ta.is_revealed = true
      AND ta.prize_id IS NOT NULL
      AND (p_competition_id IS NULL OR ta.competition_id = p_competition_id)
      AND NOT EXISTS (
        SELECT 1
        FROM public.prize_fulfillments pf
        WHERE pf.ticket_id = ta.id
      )
  LOOP
    BEGIN
      v_allocation := public.allocate_instant_win_prize(v_ticket.id, p_user_id);
      IF COALESCE((v_allocation->>'success')::boolean, false) THEN
        v_prizes_allocated := v_prizes_allocated + 1;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to allocate prize for ticket %: %', v_ticket.id, SQLERRM;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'revealed_count', v_revealed_count,
    'prizes_allocated', v_prizes_allocated
  );
END;
$$;

COMMENT ON FUNCTION public.reveal_all_instant_win_tickets(UUID, UUID) IS
  'Reveals unrevealed instant-win tickets for the current user; optionally scoped to one competition';

GRANT EXECUTE ON FUNCTION public.reveal_all_instant_win_tickets(UUID, UUID) TO authenticated;
