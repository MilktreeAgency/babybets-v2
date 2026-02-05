-- ============================================
-- FIX INFLUENCER UPDATE POLICY (NO RECURSION)
-- Description: Fix the infinite recursion issue by using a simpler policy
--              and a trigger to protect critical fields
-- Version: 1.0
-- ============================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Influencers can update own profile" ON public.influencers;

-- Create a simpler policy that just checks ownership
CREATE POLICY "Influencers can update own profile"
ON public.influencers FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create a trigger function to prevent changes to critical fields
CREATE OR REPLACE FUNCTION public.protect_influencer_critical_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow non-admin users to update specific fields
  -- Admins can update everything (checked via is_admin function)
  IF NOT public.is_admin() THEN
    -- Prevent changes to critical system-managed fields
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'Cannot modify is_active field';
    END IF;

    IF NEW.commission_tier IS DISTINCT FROM OLD.commission_tier THEN
      RAISE EXCEPTION 'Cannot modify commission_tier field';
    END IF;

    IF NEW.slug IS DISTINCT FROM OLD.slug THEN
      RAISE EXCEPTION 'Cannot modify slug field';
    END IF;

    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Cannot modify user_id field';
    END IF;

    -- Prevent changes to sales/commission tracking fields
    IF NEW.total_sales_pence IS DISTINCT FROM OLD.total_sales_pence THEN
      RAISE EXCEPTION 'Cannot modify total_sales_pence field';
    END IF;

    IF NEW.total_commission_pence IS DISTINCT FROM OLD.total_commission_pence THEN
      RAISE EXCEPTION 'Cannot modify total_commission_pence field';
    END IF;

    IF NEW.monthly_sales_pence IS DISTINCT FROM OLD.monthly_sales_pence THEN
      RAISE EXCEPTION 'Cannot modify monthly_sales_pence field';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce field protection
DROP TRIGGER IF EXISTS protect_influencer_fields_trigger ON public.influencers;
CREATE TRIGGER protect_influencer_fields_trigger
  BEFORE UPDATE ON public.influencers
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_influencer_critical_fields();

COMMENT ON FUNCTION public.protect_influencer_critical_fields IS
  'Prevents non-admin users from modifying critical system-managed fields in the influencers table';
