-- Create wheel_claims table to track spin-the-wheel prize claims
-- This ensures each email can only claim once (new customers only)

CREATE TABLE IF NOT EXISTS wheel_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  prize_type TEXT NOT NULL, -- 'credit', 'discount', 'free_entry'
  prize_label TEXT NOT NULL, -- e.g., '£5 Credit', '10% Off Order'
  prize_value TEXT NOT NULL, -- e.g., 'CREDIT5', 'BABY10', 'FREEENTRY'
  prize_amount NUMERIC, -- Numeric value for credits (in GBP) or discount percentage
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable, as user might not be logged in
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL, -- Link to generated promo code if applicable
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on email for fast lookup (checking if email has already claimed)
CREATE INDEX IF NOT EXISTS wheel_claims_email_idx ON wheel_claims(email);

-- Create index on user_id for user-specific queries
CREATE INDEX IF NOT EXISTS wheel_claims_user_id_idx ON wheel_claims(user_id);

-- Create index on claimed_at for time-based queries
CREATE INDEX IF NOT EXISTS wheel_claims_claimed_at_idx ON wheel_claims(claimed_at);

-- Enable Row Level Security
ALTER TABLE wheel_claims ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own claims
CREATE POLICY "Users can view their own wheel claims"
  ON wheel_claims
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy: Service role can insert claims (for backend processing)
CREATE POLICY "Service role can insert wheel claims"
  ON wheel_claims
  FOR INSERT
  WITH CHECK (true);

-- Policy: Service role and admins can update claims
CREATE POLICY "Service role and admins can update wheel claims"
  ON wheel_claims
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can view all claims
CREATE POLICY "Admins can view all wheel claims"
  ON wheel_claims
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Add comment
COMMENT ON TABLE wheel_claims IS 'Tracks spin-the-wheel prize claims. Each email can only claim once (new customers only policy).';
