-- Create a SECURITY DEFINER function to approve influencer applications
-- This bypasses the protect_influencer_fields trigger by running with elevated privileges

CREATE OR REPLACE FUNCTION public.approve_influencer_application(
  p_influencer_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the influencer record with user_id and activate it
  UPDATE influencers
  SET
    user_id = p_user_id,
    is_active = true,
    updated_at = NOW()
  WHERE id = p_influencer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Influencer not found';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.approve_influencer_application IS
  'Approves an influencer application by setting user_id and is_active=true. SECURITY DEFINER allows this to bypass field protection triggers.';
