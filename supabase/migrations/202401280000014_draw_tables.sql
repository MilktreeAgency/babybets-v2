-- ============================================
-- MAIN PRIZE DRAW SYSTEM
-- Description: Tables for cryptographically secure competition draws
-- ============================================

-- ============================================
-- TABLE: draw_snapshots
-- Description: Deterministic snapshots of all tickets for a competition draw
-- ============================================

CREATE TABLE public.draw_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,

  -- Snapshot integrity
  snapshot_hash TEXT NOT NULL, -- SHA-256 of ordered ticket IDs
  total_entries INTEGER NOT NULL,
  paid_entries INTEGER NOT NULL,
  postal_entries INTEGER DEFAULT 0,
  promotional_entries INTEGER DEFAULT 0,

  -- Ticket data
  ticket_ids_json JSONB NOT NULL, -- Ordered array of all valid ticket IDs

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_draw_snapshots_competition ON public.draw_snapshots(competition_id);

COMMENT ON TABLE public.draw_snapshots IS 'Deterministic snapshots of all tickets for competition draws';
COMMENT ON COLUMN public.draw_snapshots.snapshot_hash IS 'SHA-256 hash of ordered ticket IDs for verification';
COMMENT ON COLUMN public.draw_snapshots.ticket_ids_json IS 'Ordered array of all valid ticket IDs in the draw';

-- ============================================
-- TABLE: draws
-- Description: Draw execution records with cryptographic proof
-- ============================================

CREATE TABLE public.draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  snapshot_id UUID NOT NULL REFERENCES public.draw_snapshots(id) ON DELETE CASCADE,

  -- Random selection
  random_seed TEXT NOT NULL, -- Cryptographically secure random bytes (hex string)
  random_source TEXT DEFAULT 'crypto.randomBytes', -- Source of randomness
  winner_index INTEGER NOT NULL,

  -- Winner
  winning_ticket_id UUID NOT NULL REFERENCES public.ticket_allocations(id),
  winning_user_id UUID NOT NULL REFERENCES public.profiles(id),

  -- Verification
  verification_hash TEXT NOT NULL, -- SHA-256(snapshot_hash + random_seed + winner_index)

  -- Execution metadata
  executed_by UUID REFERENCES public.profiles(id), -- Admin who executed draw
  executed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Winner notification
  winner_notified_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_draws_competition ON public.draws(competition_id);
CREATE INDEX idx_draws_winning_user ON public.draws(winning_user_id);
CREATE INDEX idx_draws_executed_at ON public.draws(executed_at);

COMMENT ON TABLE public.draws IS 'Draw execution records with cryptographic proof for audit trail';
COMMENT ON COLUMN public.draws.random_seed IS 'Cryptographically secure random seed used for winner selection';
COMMENT ON COLUMN public.draws.verification_hash IS 'Triple hash for independent verification: SHA-256(snapshot_hash + seed + index)';

-- ============================================
-- TABLE: draw_audit_log
-- Description: Audit trail of all draw-related actions
-- ============================================

CREATE TABLE public.draw_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE,
  competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,

  -- Action details
  action TEXT NOT NULL, -- 'draw_executed', 'draw_verified', 'competition_cancelled', etc.
  actor_id UUID REFERENCES public.profiles(id), -- Admin who performed the action
  details JSONB, -- Additional details about the action

  -- Metadata
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_draw_audit_log_draw ON public.draw_audit_log(draw_id);
CREATE INDEX idx_draw_audit_log_competition ON public.draw_audit_log(competition_id);
CREATE INDEX idx_draw_audit_log_actor ON public.draw_audit_log(actor_id);
CREATE INDEX idx_draw_audit_log_created_at ON public.draw_audit_log(created_at);

COMMENT ON TABLE public.draw_audit_log IS 'Audit trail of all draw-related actions for compliance';
COMMENT ON COLUMN public.draw_audit_log.action IS 'Type of action performed (draw_executed, verified, cancelled, etc.)';
COMMENT ON COLUMN public.draw_audit_log.details IS 'JSONB object with action-specific details';

-- ============================================
-- Add is_main_winner flag to ticket_allocations
-- ============================================

ALTER TABLE public.ticket_allocations
ADD COLUMN IF NOT EXISTS is_main_winner BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ticket_allocations_main_winner
ON public.ticket_allocations(competition_id)
WHERE is_main_winner = true;

COMMENT ON COLUMN public.ticket_allocations.is_main_winner IS 'True if this ticket won the main prize draw';
