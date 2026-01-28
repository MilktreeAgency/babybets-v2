-- ============================================
-- RLS POLICIES: prize_templates
-- Description: Row level security policies for prize_templates table
-- Dependencies: prize_templates table, is_admin function
-- ============================================

-- Everyone can view active prize templates (for public displays)
CREATE POLICY "Anyone can view active prize templates"
  ON public.prize_templates FOR SELECT
  USING (is_active = true);

-- Admins can view all prize templates (including inactive)
CREATE POLICY "Admins can view all prize templates"
  ON public.prize_templates FOR SELECT
  USING (public.is_admin());

-- Admins can insert prize templates
CREATE POLICY "Admins can insert prize templates"
  ON public.prize_templates FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update prize templates
CREATE POLICY "Admins can update prize templates"
  ON public.prize_templates FOR UPDATE
  USING (public.is_admin());

-- Admins can delete prize templates
CREATE POLICY "Admins can delete prize templates"
  ON public.prize_templates FOR DELETE
  USING (public.is_admin());
