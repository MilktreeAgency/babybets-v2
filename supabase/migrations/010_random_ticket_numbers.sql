-- ============================================
-- MIGRATION: Random Ticket Number Generation
-- Description: Update generate_ticket_pool function to use Fisher-Yates shuffle for random ticket numbers
-- Date: 2026-01-31
-- ============================================

-- Drop and recreate the function with randomization logic
DROP FUNCTION IF EXISTS public.generate_ticket_pool(UUID);

CREATE OR REPLACE FUNCTION public.generate_ticket_pool(
  p_competition_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_competition RECORD;
  v_prize RECORD;
  v_ticket_ids UUID[];
  v_prize_tickets UUID[];
  v_random_index INTEGER;
  v_ticket_number TEXT;
  v_generated_count INTEGER := 0;
  v_prizes_allocated INTEGER := 0;
  v_i INTEGER;
  v_ticket_numbers INTEGER[];
  v_temp INTEGER;
  v_j INTEGER;
BEGIN
  RAISE NOTICE 'Starting ticket pool generation for competition: %', p_competition_id;

  -- Check admin role using is_admin() helper
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can generate ticket pools';
  END IF;

  -- Get competition details
  SELECT * INTO v_competition
  FROM competitions
  WHERE id = p_competition_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Competition not found';
  END IF;

  RAISE NOTICE 'Competition found: % (type: %, max_tickets: %)', v_competition.title, v_competition.competition_type, v_competition.max_tickets;

  -- Check if pool is already locked
  IF v_competition.ticket_pool_locked = true THEN
    RAISE EXCEPTION 'Ticket pool is already locked for this competition';
  END IF;

  -- Check if any tickets already sold
  IF v_competition.tickets_sold > 0 THEN
    RAISE EXCEPTION 'Cannot generate pool: tickets already sold';
  END IF;

  -- Delete any existing unsold tickets (for regeneration)
  DELETE FROM ticket_allocations
  WHERE competition_id = p_competition_id
    AND is_sold = false;

  -- Generate array of sequential numbers from 1 to max_tickets
  v_ticket_numbers := ARRAY(SELECT generate_series(1, v_competition.max_tickets));

  -- Fisher-Yates shuffle algorithm for cryptographically secure randomization
  -- Shuffle the array to randomize ticket number assignment
  FOR v_i IN REVERSE array_length(v_ticket_numbers, 1)..2 LOOP
    -- Generate random index from 1 to v_i using secure random bytes
    v_j := (
      (('x' || encode(gen_random_bytes(4), 'hex'))::bit(32)::bigint::numeric % v_i)::integer
    ) + 1;

    -- Swap elements at positions v_i and v_j
    v_temp := v_ticket_numbers[v_i];
    v_ticket_numbers[v_i] := v_ticket_numbers[v_j];
    v_ticket_numbers[v_j] := v_temp;
  END LOOP;

  RAISE NOTICE 'Ticket numbers shuffled. Generating % tickets...', v_competition.max_tickets;

  -- Generate all tickets with randomized 7-digit codes
  FOR v_i IN 1..v_competition.max_tickets LOOP
    -- Use shuffled number and pad with leading zeros for 7-digit format
    v_ticket_number := LPAD(v_ticket_numbers[v_i]::TEXT, 7, '0');

    INSERT INTO ticket_allocations (
      competition_id,
      ticket_number,
      prize_id,
      is_sold,
      sold_at,
      sold_to_user_id,
      is_revealed
    ) VALUES (
      p_competition_id,
      v_ticket_number,
      NULL,  -- Prize assigned in next step
      false,
      NULL,
      NULL,
      false
    );

    v_generated_count := v_generated_count + 1;
  END LOOP;

  -- Collect all ticket IDs for prize distribution
  SELECT array_agg(id ORDER BY ticket_number ASC)
  INTO v_ticket_ids
  FROM ticket_allocations
  WHERE competition_id = p_competition_id;

  -- Distribute instant win prizes randomly across the pool
  -- Only for instant win competitions
  IF v_competition.competition_type IN ('instant_win', 'instant_win_with_end_prize') THEN
    RAISE NOTICE 'Competition type is %, starting prize allocation', v_competition.competition_type;

    FOR v_prize IN
      SELECT * FROM competition_instant_win_prizes
      WHERE competition_id = p_competition_id
      ORDER BY tier ASC  -- Allocate higher tier prizes first
    LOOP
      RAISE NOTICE 'Allocating prize: % (quantity: %)', v_prize.id, v_prize.total_quantity;

      -- Allocate each prize quantity times
      FOR v_i IN 1..v_prize.total_quantity LOOP
        -- Find tickets without prizes assigned
        SELECT array_agg(id)
        INTO v_prize_tickets
        FROM ticket_allocations
        WHERE competition_id = p_competition_id
          AND prize_id IS NULL;

        -- Exit if no more tickets available
        IF v_prize_tickets IS NULL OR array_length(v_prize_tickets, 1) = 0 THEN
          RAISE WARNING 'Not enough tickets to allocate all prizes';
          EXIT;
        END IF;

        -- Select random ticket using cryptographically secure randomness
        v_random_index := (
          (('x' || encode(gen_random_bytes(4), 'hex'))::bit(32)::bigint::numeric % array_length(v_prize_tickets, 1))::integer
        ) + 1;

        RAISE NOTICE 'Assigning prize % to ticket at index % (ticket ID: %)', v_prize.id, v_random_index, v_prize_tickets[v_random_index];

        -- Assign prize to random ticket
        UPDATE ticket_allocations
        SET prize_id = v_prize.id
        WHERE id = v_prize_tickets[v_random_index];

        v_prizes_allocated := v_prizes_allocated + 1;
        RAISE NOTICE 'Prize assigned successfully. Total prizes allocated: %', v_prizes_allocated;
      END LOOP;
    END LOOP;

    RAISE NOTICE 'Prize allocation complete. Total allocated: %', v_prizes_allocated;
  ELSE
    RAISE NOTICE 'Competition type is %, skipping prize allocation', v_competition.competition_type;
  END IF;

  -- Lock the ticket pool
  UPDATE competitions
  SET
    ticket_pool_locked = true,
    ticket_pool_generated_at = NOW(),
    updated_at = NOW()
  WHERE id = p_competition_id;

  -- Return success result
  RAISE NOTICE 'Ticket pool generation complete. Tickets: %, Prizes: %', v_generated_count, v_prizes_allocated;

  RETURN jsonb_build_object(
    'success', true,
    'competition_id', p_competition_id,
    'tickets_generated', v_generated_count,
    'prizes_allocated', v_prizes_allocated,
    'pool_locked_at', NOW(),
    'message', FORMAT('Successfully generated %s tickets with %s instant win prizes', v_generated_count, v_prizes_allocated)
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback ticket pool lock on error
    UPDATE competitions
    SET ticket_pool_locked = false
    WHERE id = p_competition_id;

    RAISE EXCEPTION 'Error generating ticket pool: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.generate_ticket_pool(UUID) IS
  'Generates pre-allocated ticket pool with randomized 7-digit codes and random prize distribution (admin only)';
