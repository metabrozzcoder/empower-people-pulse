CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin'::app_role) THEN
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
$function$;