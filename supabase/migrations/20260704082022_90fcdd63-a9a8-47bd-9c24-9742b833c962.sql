
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen timestamptz;

CREATE OR REPLACE VIEW public.profiles_public AS
SELECT id, name, avatar_url, "position", department, organization, status, preferred_language, created_at, last_seen
FROM public.profiles;

CREATE OR REPLACE FUNCTION public.mark_messages_read(_conv uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.messages
     SET read_at = now()
   WHERE conversation_id = _conv
     AND sender_id <> auth.uid()
     AND read_at IS NULL
     AND public.is_conversation_member(_conv, auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.mark_messages_read(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_last_seen()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles SET last_seen = now() WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.touch_last_seen() TO authenticated;

ALTER TABLE public.messages REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
