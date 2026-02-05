-- ============================================
-- BACKFILL CORRECT COMMISSION VALUES
-- Description: Fix existing influencer_sales records that have incorrect
--              order_value_pence and commission_pence due to the bug
-- Version: 1.0
-- ============================================

-- Update existing influencer_sales records with correct values
UPDATE public.influencer_sales AS isales
SET
  order_value_pence = o.subtotal_pence - COALESCE(o.discount_pence, 0),
  commission_pence = ROUND((o.subtotal_pence - COALESCE(o.discount_pence, 0)) * isales.commission_rate)
FROM public.orders AS o
WHERE isales.order_id = o.id
  AND isales.order_value_pence = 0  -- Only fix records with zero order value
  AND o.subtotal_pence > 0;          -- That have a valid subtotal

-- Also update the influencer stats to reflect correct values
WITH corrected_sales AS (
  SELECT
    isales.influencer_id,
    SUM(o.subtotal_pence - COALESCE(o.discount_pence, 0)) AS correct_total_sales,
    SUM(ROUND((o.subtotal_pence - COALESCE(o.discount_pence, 0)) * isales.commission_rate)) AS correct_total_commission
  FROM public.influencer_sales AS isales
  JOIN public.orders AS o ON o.id = isales.order_id
  GROUP BY isales.influencer_id
)
UPDATE public.influencers AS i
SET
  total_sales_pence = cs.correct_total_sales,
  total_commission_pence = cs.correct_total_commission
FROM corrected_sales AS cs
WHERE i.id = cs.influencer_id;

-- Log the fix
DO $$
DECLARE
  v_fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_fixed_count
  FROM public.influencer_sales
  WHERE order_value_pence > 0;

  RAISE NOTICE 'Fixed influencer sales records. Total records with valid values: %', v_fixed_count;
END $$;
