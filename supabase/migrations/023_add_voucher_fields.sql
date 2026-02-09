-- Add voucher code and description fields to prize_fulfillments table
-- These fields are used for digital vouchers and gift cards

ALTER TABLE prize_fulfillments
ADD COLUMN IF NOT EXISTS voucher_code TEXT,
ADD COLUMN IF NOT EXISTS voucher_description TEXT;

-- Add index for voucher_code lookups
CREATE INDEX IF NOT EXISTS idx_prize_fulfillments_voucher_code
ON prize_fulfillments(voucher_code)
WHERE voucher_code IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN prize_fulfillments.voucher_code IS 'Gift card or voucher code provided to the user';
COMMENT ON COLUMN prize_fulfillments.voucher_description IS 'Optional instructions or description for using the voucher';
