-- ============================================
-- TICKET POOL GENERATION SYSTEM
-- Description: Pre-allocated ticket pools with instant win prize distribution
-- ============================================

-- ============================================
-- HELPER FUNCTION: Generate Random Alphanumeric Code
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_alphanumeric_code(code_length INTEGER DEFAULT 7)
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  v_chars TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  v_chars_length INTEGER := 62; -- 10 digits + 26 uppercase + 26 lowercase
  v_result TEXT := '';
  v_i INTEGER;
  v_random_index INTEGER;
BEGIN
  FOR v_i IN 1..code_length LOOP
    -- Generate cryptographically secure random index
    v_random_index := (
      (('x' || encode(gen_random_bytes(4), 'hex'))::bit(32)::bigint::numeric % v_chars_length)::integer
    ) + 1;

    -- Append random character
    v_result := v_result || substring(v_chars, v_random_index, 1);
  END LOOP;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.generate_alphanumeric_code(INTEGER) IS
  'Generates a cryptographically secure random alphanumeric code (0-9, A-Z, a-z)';

-- ============================================
-- FUNCTION: generate_ticket_pool
-- Description: Generates and locks a pre-allocated ticket pool for a competition with alphanumeric codes
-- ============================================

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
  v_max_attempts INTEGER := 100; -- Max attempts to generate unique code
  v_attempt INTEGER;
  v_code_exists BOOLEAN;
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

  RAISE NOTICE 'Generating % alphanumeric tickets...', v_competition.max_tickets;

  -- Generate all tickets with random 7-character alphanumeric codes
  FOR v_i IN 1..v_competition.max_tickets LOOP
    v_attempt := 0;
    v_code_exists := true;

    -- Generate unique code (retry if collision occurs)
    WHILE v_code_exists AND v_attempt < v_max_attempts LOOP
      v_ticket_number := generate_alphanumeric_code(7);

      -- Check if code already exists in this competition
      SELECT EXISTS(
        SELECT 1 FROM ticket_allocations
        WHERE competition_id = p_competition_id
          AND ticket_number = v_ticket_number
      ) INTO v_code_exists;

      v_attempt := v_attempt + 1;
    END LOOP;

    -- If still exists after max attempts, raise error
    IF v_code_exists THEN
      RAISE EXCEPTION 'Failed to generate unique ticket code after % attempts', v_max_attempts;
    END IF;

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

    -- Log progress every 1000 tickets
    IF v_generated_count % 1000 = 0 THEN
      RAISE NOTICE 'Generated % tickets...', v_generated_count;
    END IF;
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
    'message', FORMAT('Successfully generated %s alphanumeric tickets with %s instant win prizes', v_generated_count, v_prizes_allocated)
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
  'Generates pre-allocated ticket pool with random 7-character alphanumeric codes (0-9, A-Z, a-z) and random prize distribution (admin only)';

-- ============================================
-- NOTE: complete_order_with_wallet is defined in 003_functions.sql
-- ============================================
-- FUNCTION: get_ticket_pool_stats
-- Description: Returns statistics about a competition's ticket pool
-- ============================================

CREATE OR REPLACE FUNCTION public.get_ticket_pool_stats(p_competition_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_competition RECORD;
BEGIN
  SELECT * INTO v_competition
  FROM competitions
  WHERE id = p_competition_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Competition not found';
  END IF;

  SELECT jsonb_build_object(
    'competition_id', p_competition_id,
    'is_locked', v_competition.ticket_pool_locked,
    'generated_at', v_competition.ticket_pool_generated_at,
    'max_tickets', v_competition.max_tickets,
    'tickets_sold', v_competition.tickets_sold,
    'tickets_available', (
      SELECT COUNT(*)
      FROM ticket_allocations
      WHERE competition_id = p_competition_id AND is_sold = false
    ),
    'tickets_with_prizes', (
      SELECT COUNT(*)
      FROM ticket_allocations
      WHERE competition_id = p_competition_id AND prize_id IS NOT NULL
    ),
    'tickets_revealed', (
      SELECT COUNT(*)
      FROM ticket_allocations
      WHERE competition_id = p_competition_id AND is_revealed = true
    ),
    'prize_breakdown', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'prize_name', pt.name,
          'total_quantity', ciwp.total_quantity,
          'remaining_quantity', ciwp.remaining_quantity,
          'allocated', ciwp.total_quantity - ciwp.remaining_quantity
        )
      )
      FROM competition_instant_win_prizes ciwp
      JOIN prize_templates pt ON pt.id = ciwp.prize_template_id
      WHERE ciwp.competition_id = p_competition_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_ticket_pool_stats IS
  'Returns detailed statistics about a competition ticket pool';
