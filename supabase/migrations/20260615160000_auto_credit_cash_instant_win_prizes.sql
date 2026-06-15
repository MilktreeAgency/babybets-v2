-- Cash instant-win prizes should credit the user's wallet immediately (like SiteCredit).
-- Physical prizes still require the user to choose prize vs cash alternative.

CREATE OR REPLACE FUNCTION public.allocate_instant_win_prize(
  p_ticket_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  v_value_pence INTEGER;
BEGIN
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

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found or does not belong to user';
  END IF;

  IF NOT v_ticket.is_revealed THEN
    RAISE EXCEPTION 'Ticket must be revealed before allocating prize';
  END IF;

  IF v_ticket.prize_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Ticket has no prize to allocate'
    );
  END IF;

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

  IF EXISTS (
    SELECT 1 FROM public.prize_fulfillments
    WHERE ticket_id = p_ticket_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Prize already allocated for this ticket'
    );
  END IF;

  SELECT
    COALESCE(
      CASE
        WHEN p.first_name IS NOT NULL AND p.first_name != ''
        THEN p.first_name || ' ' || LEFT(COALESCE(p.last_name, ''), 1) || '.'
        ELSE SPLIT_PART(p.email, '@', 1)
      END,
      'Lucky Winner'
    )
  INTO v_user_display_name
  FROM public.profiles p
  WHERE p.id = p_user_id;

  v_claim_deadline := NOW() + INTERVAL '30 days';
  v_value_pence := ROUND(v_prize_template.value_gbp * 100);

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
    v_value_pence,
    v_claim_deadline,
    NOW()
  )
  RETURNING id INTO v_fulfillment_id;

  -- SiteCredit and Cash prizes are credited to the wallet immediately
  IF v_prize_template.type IN ('SiteCredit', 'Cash') THEN
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
      v_value_pence,
      v_value_pence,
      'active',
      'instant_win',
      v_ticket.competition_id,
      p_ticket_id,
      v_ticket.prize_id,
      CASE
        WHEN v_prize_template.type = 'Cash'
        THEN 'Cash prize won from instant win competition'
        ELSE 'Won ' || v_prize_template.name || ' from instant win competition'
      END,
      v_expiry_date
    )
    RETURNING id INTO v_wallet_credit_id;

    UPDATE public.prize_fulfillments
    SET
      status = 'completed',
      responded_at = NOW(),
      choice = CASE
        WHEN v_prize_template.type = 'Cash' THEN 'cash'
        ELSE 'prize'
      END
    WHERE id = v_fulfillment_id;
  END IF;

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

  UPDATE public.competition_instant_win_prizes
  SET
    remaining_quantity = remaining_quantity - 1,
    updated_at = NOW()
  WHERE id = v_ticket.prize_id
    AND remaining_quantity > 0;

  IF NOT FOUND THEN
    RAISE WARNING 'Prize quantity was not decremented - may already be at zero';
  END IF;

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
      WHEN v_prize_template.type IN ('SiteCredit', 'Cash')
      THEN 'Congratulations! £' || TO_CHAR(v_prize_template.value_gbp, 'FM999999990.00') || ' has been added to your wallet.'
      ELSE 'Congratulations! You won ' || v_prize_template.name || '!'
    END
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error allocating prize: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.allocate_instant_win_prize IS
  'Handles complete prize allocation flow: creates fulfillment, wallet credits (for SiteCredit and Cash), winner record, and decrements prize quantity';

-- Backfill any pending Cash prize fulfillments that were created before this fix
DO $$
DECLARE
  v_rec RECORD;
  v_expiry_date TIMESTAMPTZ;
  v_value_pence INTEGER;
BEGIN
  FOR v_rec IN
    SELECT
      pf.id AS fulfillment_id,
      pf.user_id,
      pf.ticket_id,
      pf.prize_id,
      pf.competition_id,
      pt.name,
      pt.value_gbp
    FROM public.prize_fulfillments pf
    INNER JOIN public.competition_instant_win_prizes ciwp ON ciwp.id = pf.prize_id
    INNER JOIN public.prize_templates pt ON pt.id = ciwp.prize_template_id
    WHERE pt.type = 'Cash'
      AND pf.status = 'pending'
      AND NOT EXISTS (
        SELECT 1
        FROM public.wallet_credits wc
        WHERE wc.source_ticket_id = pf.ticket_id
          AND wc.source_prize_id = pf.prize_id
          AND wc.source_type = 'instant_win'
      )
  LOOP
    v_expiry_date := NOW() + INTERVAL '90 days';
    v_value_pence := ROUND(v_rec.value_gbp * 100);

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
      v_rec.user_id,
      v_value_pence,
      v_value_pence,
      'active',
      'instant_win',
      v_rec.competition_id,
      v_rec.ticket_id,
      v_rec.prize_id,
      'Cash prize won from instant win competition',
      v_expiry_date
    );

    UPDATE public.prize_fulfillments
    SET
      status = 'completed',
      responded_at = NOW(),
      choice = 'cash'
    WHERE id = v_rec.fulfillment_id;
  END LOOP;
END;
$$;
