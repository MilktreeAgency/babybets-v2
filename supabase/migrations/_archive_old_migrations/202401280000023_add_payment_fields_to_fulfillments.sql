-- ============================================
-- MIGRATION: Add payment fields to prize_fulfillments
-- Description: Add payment reference and method fields for cash alternative processing
-- Dependencies: prize_fulfillments table
-- ============================================

-- Add payment fields for cash alternatives (IF NOT EXISTS to handle re-runs)
ALTER TABLE public.prize_fulfillments
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;

-- Add comments
COMMENT ON COLUMN public.prize_fulfillments.payment_method IS 'Payment method for cash alternatives (e.g., Bank Transfer, PayPal, Cheque)';
COMMENT ON COLUMN public.prize_fulfillments.payment_reference IS 'Payment reference/transaction ID for cash alternatives';
COMMENT ON COLUMN public.prize_fulfillments.payment_date IS 'Date when cash payment was processed';
