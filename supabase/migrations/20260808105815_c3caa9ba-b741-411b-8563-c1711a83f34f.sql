ALTER TABLE public.workspace_docs
  ADD COLUMN IF NOT EXISTS source_path text,
  ADD COLUMN IF NOT EXISTS source_format text;

DROP POLICY IF EXISTS "Workspace files readable by authenticated" ON storage.objects;
CREATE POLICY "Workspace files readable by authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'workspace-files');

DROP POLICY IF EXISTS "Workspace files uploadable by authenticated" ON storage.objects;
CREATE POLICY "Workspace files uploadable by authenticated"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'workspace-files');

DROP POLICY IF EXISTS "Workspace files updatable by owner" ON storage.objects;
CREATE POLICY "Workspace files updatable by owner"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'workspace-files' AND owner = auth.uid());

DROP POLICY IF EXISTS "Workspace files deletable by owner" ON storage.objects;
CREATE POLICY "Workspace files deletable by owner"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'workspace-files' AND owner = auth.uid());