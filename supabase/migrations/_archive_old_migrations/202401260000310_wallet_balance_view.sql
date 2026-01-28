-- ============================================
-- VIEW: wallet_balance_view
-- Description: User wallet balance with expiry information
-- Dependencies: wallet_credits table
-- ============================================

CREATE VIEW public.wallet_balance_view AS
SELECT
  user_id,
  SUM(remaining_pence) FILTER (
    WHERE status = 'active' AND expires_at > NOW()
  ) as available_balance_pence,
  SUM(remaining_pence) FILTER (
    WHERE status = 'active'
    AND expires_at > NOW()
    AND expires_at <= NOW() + INTERVAL '7 days'
  ) as expiring_soon_pence,
  MIN(expires_at) FILTER (
    WHERE status = 'active' AND expires_at > NOW()
  ) as next_expiry_date
FROM public.wallet_credits
GROUP BY user_id;

COMMENT ON VIEW public.wallet_balance_view IS
  'User wallet balances with expiry tracking for efficient balance queries';
