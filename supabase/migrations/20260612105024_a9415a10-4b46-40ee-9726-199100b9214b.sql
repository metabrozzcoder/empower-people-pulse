
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS body_html text;

ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_visibility_check;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_visibility_check CHECK (visibility IN ('private','public'));

-- Allow public (anon + authenticated) read of approved public documents
DROP POLICY IF EXISTS doc_select_public ON public.documents;
CREATE POLICY doc_select_public ON public.documents
  FOR SELECT
  TO anon, authenticated
  USING (visibility = 'public' AND status = 'approved');

GRANT SELECT ON public.documents TO anon;
