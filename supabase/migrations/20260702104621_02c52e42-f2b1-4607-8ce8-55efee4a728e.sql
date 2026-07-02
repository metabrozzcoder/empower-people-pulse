
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Storage policies for chat-attachments bucket
-- Path convention: {conversation_id}/{uuid}-{filename}
CREATE POLICY "Chat members can read attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND public.is_conversation_member(
    ((storage.foldername(name))[1])::uuid,
    auth.uid()
  )
);

CREATE POLICY "Chat members can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND public.is_conversation_member(
    ((storage.foldername(name))[1])::uuid,
    auth.uid()
  )
  AND owner = auth.uid()
);

CREATE POLICY "Owners can delete their chat attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND owner = auth.uid()
);
