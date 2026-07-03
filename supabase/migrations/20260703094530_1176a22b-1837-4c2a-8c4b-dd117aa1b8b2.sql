
CREATE OR REPLACE FUNCTION public.sync_profile_sections_from_custom_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secs jsonb;
BEGIN
  SELECT to_jsonb(cr.allowed_sections) INTO secs
    FROM public.custom_roles cr
   WHERE cr.id = NEW.custom_role_id;

  IF secs IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.profiles
     SET allowed_sections = secs,
         section_access   = secs,
         updated_at       = now()
   WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_sections_from_ucr ON public.user_custom_roles;
CREATE TRIGGER trg_sync_profile_sections_from_ucr
AFTER INSERT OR UPDATE ON public.user_custom_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_sections_from_custom_role();

CREATE OR REPLACE FUNCTION public.propagate_custom_role_sections()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secs jsonb;
BEGIN
  IF NEW.allowed_sections IS NOT DISTINCT FROM OLD.allowed_sections THEN
    RETURN NEW;
  END IF;

  secs := to_jsonb(NEW.allowed_sections);

  UPDATE public.profiles p
     SET allowed_sections = secs,
         section_access   = secs,
         updated_at       = now()
    FROM public.user_custom_roles ucr
   WHERE ucr.custom_role_id = NEW.id
     AND ucr.user_id = p.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_propagate_custom_role_sections ON public.custom_roles;
CREATE TRIGGER trg_propagate_custom_role_sections
AFTER UPDATE ON public.custom_roles
FOR EACH ROW EXECUTE FUNCTION public.propagate_custom_role_sections();
