-- ============================================
-- FUNCTION: allocate_instant_win_prize
-- Description: Handles all post-reveal logic for instant win prizes
-- Called after a user reveals a winning ticket
-- ============================================

CREATE OR REPLACE FUNCTION public.allocate_instant_win_prize(
  p_ticket_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket RECORD;
  v_prize RECORD;
  v_prize_template RECORD;
  v_fulfillment_id UUID;
  v_wallet_credit_id UUID;
  v_winner_id UUID;
  v_user_display_name TEXT;
  v_expiry_date TIMESTAMPTZ;
  v_claim_deadline TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  -- Get ticket details with prize info
  SELECT
    ta.id,
    ta.competition_id,
    ta.prize_id,
    ta.sold_to_user_id,
    ta.ticket_number,
    ta.is_revealed
  INTO v_ticket
  FROM public.ticket_allocations ta
  WHERE ta.id = p_ticket_id
    AND ta.sold_to_user_id = p_user_id;

  -- Validate ticket exists and belongs to user
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found or does not belong to user';
  END IF;

  -- Check if ticket is already revealed
  IF NOT v_ticket.is_revealed THEN
    RAISE EXCEPTION 'Ticket must be revealed before allocating prize';
  END IF;

  -- Check if ticket has a prize
  IF v_ticket.prize_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Ticket has no prize to allocate'
    );
  END IF;

  -- Get prize details
  SELECT
    ciwp.id,
    ciwp.prize_template_id,
    ciwp.remaining_quantity,
    ciwp.prize_code
  INTO v_prize
  FROM public.competition_instant_win_prizes ciwp
  WHERE ciwp.id = v_ticket.prize_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prize not found';
  END IF;

  -- Get prize template details
  SELECT
    pt.id,
    pt.name,
    pt.short_name,
    pt.type,
    pt.value_gbp,
    pt.cash_alternative_gbp,
    pt.description,
    pt.image_url
  INTO v_prize_template
  FROM public.prize_templates pt
  WHERE pt.id = v_prize.prize_template_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prize template not found';
  END IF;

  -- Check if fulfillment already exists (prevent duplicate allocations)
  IF EXISTS (
    SELECT 1 FROM public.prize_fulfillments
    WHERE ticket_id = p_ticket_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Prize already allocated for this ticket'
    );
  END IF;

  -- Get user display name
  SELECT
    COALESCE(
      CASE
        WHEN p.display_name IS NOT NULL AND p.display_name != ''
        THEN p.display_name
        ELSE SPLIT_PART(p.email, '@', 1)
      END,
      'Lucky Winner'
    )
  INTO v_user_display_name
  FROM public.profiles p
  WHERE p.id = p_user_id;

  -- Set claim deadline (30 days from now)
  v_claim_deadline := NOW() + INTERVAL '30 days';

  -- Create prize fulfillment record
  INSERT INTO public.prize_fulfillments (
    user_id,
    ticket_id,
    prize_id,
    competition_id,
    status,
    value_pence,
    claim_deadline,
    notified_at
  ) VALUES (
    p_user_id,
    p_ticket_id,
    v_ticket.prize_id,
    v_ticket.competition_id,
    'pending',
    ROUND(v_prize_template.value_gbp * 100),
    v_claim_deadline,
    NOW()
  )
  RETURNING id INTO v_fulfillment_id;

  -- If prize is SiteCredit, create wallet credit
  IF v_prize_template.type = 'SiteCredit' THEN
    -- Set expiry date (90 days from now)
    v_expiry_date := NOW() + INTERVAL '90 days';

    INSERT INTO public.wallet_credits (
      user_id,
      amount_pence,
      remaining_pence,
      status,
      source_type,
      source_competition_id,
      source_ticket_id,
      source_prize_id,
      description,
      expires_at
    ) VALUES (
      p_user_id,
      ROUND(v_prize_template.value_gbp * 100),
      ROUND(v_prize_template.value_gbp * 100),
      'active',
      'instant_win',
      v_ticket.competition_id,
      p_ticket_id,
      v_ticket.prize_id,
      FORMAT('Won %s from instant win competition', v_prize_template.name),
      v_expiry_date
    )
    RETURNING id INTO v_wallet_credit_id;

    -- Auto-complete fulfillment for site credits
    UPDATE public.prize_fulfillments
    SET
      status = 'completed',
      responded_at = NOW(),
      choice = 'prize'
    WHERE id = v_fulfillment_id;
  END IF;

  -- Create winner record for social proof
  INSERT INTO public.winners (
    user_id,
    display_name,
    prize_name,
    prize_value_gbp,
    prize_image_url,
    competition_id,
    ticket_id,
    win_type,
    is_public,
    show_in_ticker,
    won_at
  ) VALUES (
    p_user_id,
    v_user_display_name,
    v_prize_template.name,
    v_prize_template.value_gbp,
    v_prize_template.image_url,
    v_ticket.competition_id,
    p_ticket_id,
    'instant_win',
    true,
    true,
    NOW()
  )
  RETURNING id INTO v_winner_id;

  -- Decrement remaining quantity for the prize
  UPDATE public.competition_instant_win_prizes
  SET
    remaining_quantity = remaining_quantity - 1,
    updated_at = NOW()
  WHERE id = v_ticket.prize_id
    AND remaining_quantity > 0;

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE WARNING 'Prize quantity was not decremented - may already be at zero';
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'fulfillment_id', v_fulfillment_id,
    'wallet_credit_id', v_wallet_credit_id,
    'winner_id', v_winner_id,
    'prize', jsonb_build_object(
      'name', v_prize_template.name,
      'type', v_prize_template.type,
      'value_gbp', v_prize_template.value_gbp,
      'cash_alternative_gbp', v_prize_template.cash_alternative_gbp,
      'description', v_prize_template.description,
      'image_url', v_prize_template.image_url
    ),
    'message', CASE
      WHEN v_prize_template.type = 'SiteCredit'
      THEN FORMAT('Congratulations! £%.2f has been added to your wallet.', v_prize_template.value_gbp)
      ELSE FORMAT('Congratulations! You won %s!', v_prize_template.name)
    END
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error allocating prize: %', SQLERRM;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION public.allocate_instant_win_prize IS 'Handles complete prize allocation flow: creates fulfillment, wallet credits (for SiteCredit), winner record, and decrements prize quantity';
