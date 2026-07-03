
-- Add assignee and attachments to candidates
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_decision text,
  ADD COLUMN IF NOT EXISTS review_note text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_candidates_assigned_to ON public.candidates(assigned_to);

-- Tighten SELECT: only Admin/HR see all; assignee sees only their assigned candidates
DROP POLICY IF EXISTS "Authenticated can view candidates" ON public.candidates;

CREATE POLICY "Admin/HR view all candidates"
  ON public.candidates FOR SELECT
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'hr'::app_role));

CREATE POLICY "Assignee views their candidates"
  ON public.candidates FOR SELECT
  USING (assigned_to = auth.uid());

-- Assignee may update review fields on their assigned candidates
CREATE POLICY "Assignee updates review fields"
  ON public.candidates FOR UPDATE
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- Storage policies for CV / documents (bucket candidate-files, will create separately)
CREATE POLICY "Admin/HR manage candidate files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'candidate-files' AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'hr'::app_role)))
  WITH CHECK (bucket_id = 'candidate-files' AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'hr'::app_role)));

CREATE POLICY "Assignee reads candidate files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'candidate-files'
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.assigned_to = auth.uid()
        AND name LIKE c.id::text || '/%'
    )
  );
