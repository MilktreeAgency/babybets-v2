-- ============================================
-- RECALCULATE MONTHLY SALES FOR ALL INFLUENCERS
-- Description: Fix monthly_sales_pence that was incorrectly calculated by buggy trigger
-- Version: 1.0
-- ============================================

-- Recalculate monthly_sales_pence based on actual sales this month
UPDATE public.influencers AS i
SET monthly_sales_pence = COALESCE(
  (
    SELECT SUM(order_value_pence)
    FROM public.influencer_sales
    WHERE influencer_id = i.id
      AND created_at >= date_trunc('month', CURRENT_DATE)
      AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
  ),
  0
)
WHERE is_active = true;

-- Recalculate commission tiers based on corrected monthly sales
UPDATE public.influencers
SET commission_tier = public.calculate_commission_tier(COALESCE(monthly_sales_pence, 0))
WHERE is_active = true;

-- Log the results
DO $$
DECLARE
  v_updated_count INTEGER;
  v_tier_2_count INTEGER;
  v_tier_3_count INTEGER;
  v_tier_4_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_updated_count
  FROM public.influencers
  WHERE is_active = true AND monthly_sales_pence > 0;

  SELECT COUNT(*) INTO v_tier_2_count
  FROM public.influencers
  WHERE is_active = true AND commission_tier = 2;

  SELECT COUNT(*) INTO v_tier_3_count
  FROM public.influencers
  WHERE is_active = true AND commission_tier = 3;

  SELECT COUNT(*) INTO v_tier_4_count
  FROM public.influencers
  WHERE is_active = true AND commission_tier = 4;

  RAISE NOTICE 'Recalculated monthly sales for % influencers', v_updated_count;
  RAISE NOTICE 'Tier breakdown - Tier 2: %, Tier 3: %, Tier 4: %',
    v_tier_2_count, v_tier_3_count, v_tier_4_count;
END $$;
