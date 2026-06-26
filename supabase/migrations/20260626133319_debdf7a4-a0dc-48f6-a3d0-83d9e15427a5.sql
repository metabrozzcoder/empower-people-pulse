
-- Auto-default created_by to auth.uid() and allow inserts when it matches
CREATE OR REPLACE FUNCTION public.set_conversation_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_conversations_set_created_by ON public.conversations;
CREATE TRIGGER trg_conversations_set_created_by
BEFORE INSERT ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.set_conversation_created_by();

DROP POLICY IF EXISTS conv_insert ON public.conversations;
CREATE POLICY conv_insert ON public.conversations
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND (created_by IS NULL OR created_by = auth.uid()));
