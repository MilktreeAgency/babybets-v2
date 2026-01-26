-- ============================================
-- RLS POLICIES: ticket_allocations
-- Description: Row level security policies for ticket_allocations table
-- Dependencies: ticket_allocations table, is_admin function
-- ============================================

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON public.ticket_allocations FOR SELECT
  USING (sold_to_user_id = auth.uid());

-- Users can update their own tickets (for revealing)
CREATE POLICY "Users can reveal own tickets"
  ON public.ticket_allocations FOR UPDATE
  USING (sold_to_user_id = auth.uid())
  WITH CHECK (
    sold_to_user_id = auth.uid()
    AND is_revealed = true
  );

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
  ON public.ticket_allocations FOR SELECT
  USING (public.is_admin());

-- Admins can insert tickets
CREATE POLICY "Admins can insert tickets"
  ON public.ticket_allocations FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update tickets
CREATE POLICY "Admins can update tickets"
  ON public.ticket_allocations FOR UPDATE
  USING (public.is_admin());
