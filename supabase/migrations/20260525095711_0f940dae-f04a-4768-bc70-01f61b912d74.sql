
-- 1. Block privilege escalation via profiles self-update
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.permissions IS DISTINCT FROM OLD.permissions
     OR NEW.allowed_sections IS DISTINCT FROM OLD.allowed_sections
     OR NEW.section_access IS DISTINCT FROM OLD.section_access
     OR NEW.guest_id IS DISTINCT FROM OLD.guest_id THEN
    RAISE EXCEPTION 'Not allowed to modify security-sensitive profile fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_priv_esc ON public.profiles;
CREATE TRIGGER trg_prevent_profile_priv_esc
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 2. Restrict realtime broadcasts for conversation_members topic to members only
CREATE POLICY "Authenticated can receive only their conversation_members broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() NOT LIKE 'conversation_members:%')
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.user_id = auth.uid()
      AND cm.conversation_id::text = split_part(realtime.topic(), ':', 2)
  )
);
