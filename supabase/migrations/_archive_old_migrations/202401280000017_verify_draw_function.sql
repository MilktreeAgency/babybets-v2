-- ============================================
-- RPC FUNCTION: verify_draw_integrity
-- Description: Verifies the cryptographic integrity of a competition draw
-- Security: Public (read-only verification)
-- ============================================

CREATE OR REPLACE FUNCTION public.verify_draw_integrity(
  p_draw_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_draw RECORD;
  v_snapshot RECORD;
  v_ticket_ids UUID[];
  v_computed_snapshot_hash TEXT;
  v_computed_verification_hash TEXT;
  v_winning_ticket_id UUID;
  v_snapshot_valid BOOLEAN;
  v_verification_valid BOOLEAN;
  v_winner_index_valid BOOLEAN;
BEGIN
  -- Get draw details
  SELECT * INTO v_draw
  FROM draws
  WHERE id = p_draw_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draw not found';
  END IF;

  -- Get snapshot details
  SELECT * INTO v_snapshot
  FROM draw_snapshots
  WHERE id = v_draw.snapshot_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draw snapshot not found';
  END IF;

  -- Extract ticket IDs from JSONB
  SELECT array_agg(value::text::uuid ORDER BY ordinality)
  INTO v_ticket_ids
  FROM jsonb_array_elements(v_snapshot.ticket_ids_json) WITH ORDINALITY;

  -- Recompute snapshot hash
  v_computed_snapshot_hash := encode(
    digest(v_snapshot.ticket_ids_json::text, 'sha256'),
    'hex'
  );

  -- Verify snapshot hash matches
  v_snapshot_valid := (v_computed_snapshot_hash = v_snapshot.snapshot_hash);

  -- Recompute verification hash
  v_computed_verification_hash := encode(
    digest(
      v_snapshot.snapshot_hash || v_draw.random_seed || v_draw.winner_index::text,
      'sha256'
    ),
    'hex'
  );

  -- Verify verification hash matches
  v_verification_valid := (v_computed_verification_hash = v_draw.verification_hash);

  -- Verify winner index is within bounds and matches the winning ticket
  IF v_draw.winner_index >= 0 AND v_draw.winner_index < array_length(v_ticket_ids, 1) THEN
    v_winning_ticket_id := v_ticket_ids[v_draw.winner_index + 1]; -- Arrays are 1-indexed
    v_winner_index_valid := (v_winning_ticket_id = v_draw.winning_ticket_id);
  ELSE
    v_winner_index_valid := false;
  END IF;

  -- Return verification results
  RETURN jsonb_build_object(
    'valid', v_snapshot_valid AND v_verification_valid AND v_winner_index_valid,
    'draw_id', p_draw_id,
    'competition_id', v_draw.competition_id,
    'checks', jsonb_build_object(
      'snapshot_hash_valid', v_snapshot_valid,
      'verification_hash_valid', v_verification_valid,
      'winner_index_valid', v_winner_index_valid
    ),
    'details', jsonb_build_object(
      'total_entries', v_snapshot.total_entries,
      'winner_index', v_draw.winner_index,
      'stored_snapshot_hash', v_snapshot.snapshot_hash,
      'computed_snapshot_hash', v_computed_snapshot_hash,
      'stored_verification_hash', v_draw.verification_hash,
      'computed_verification_hash', v_computed_verification_hash,
      'winning_ticket_id', v_draw.winning_ticket_id,
      'expected_ticket_id', v_winning_ticket_id,
      'executed_at', v_draw.executed_at
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to all users (public verification)
GRANT EXECUTE ON FUNCTION public.verify_draw_integrity(UUID) TO public;
GRANT EXECUTE ON FUNCTION public.verify_draw_integrity(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_draw_integrity(UUID) TO authenticated;

COMMENT ON FUNCTION public.verify_draw_integrity IS 'Verifies the cryptographic integrity of a competition draw (public verification)';
