-- Fix wheel_claims RLS policy that's trying to access auth.users table
-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view their own wheel claims" ON wheel_claims;

-- Recreate it without accessing auth.users - only check user_id
CREATE POLICY "Users can view their own wheel claims"
  ON wheel_claims
  FOR SELECT
  TO authenticated
  USING (
    -- Users can only see claims linked to their user_id
    auth.uid() = user_id
  );
