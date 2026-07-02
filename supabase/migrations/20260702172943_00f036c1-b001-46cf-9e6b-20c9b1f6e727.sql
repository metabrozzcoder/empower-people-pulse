ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS profile_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS employees_profile_id_uidx
  ON public.employees (profile_id)
  WHERE profile_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS organizations_lower_name_uidx
  ON public.organizations (lower(name));

CREATE OR REPLACE FUNCTION public.sync_employee_from_profile(_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  p public.profiles%ROWTYPE;
  org_id uuid;
  is_staff boolean;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = _profile_id;

  IF NOT FOUND THEN
    DELETE FROM public.employees WHERE profile_id = _profile_id;
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _profile_id
      AND ur.role IN ('admin','hr','employee','shooting_moderator','director','tech_supply','driver','accountant')
  ) INTO is_staff;

  IF NOT is_staff THEN
    DELETE FROM public.employees WHERE profile_id = _profile_id;
    RETURN;
  END IF;

  IF NULLIF(trim(COALESCE(p.organization, '')), '') IS NOT NULL THEN
    SELECT o.id INTO org_id
    FROM public.organizations o
    WHERE lower(o.name) = lower(trim(p.organization))
    ORDER BY o.created_at ASC
    LIMIT 1;

    IF org_id IS NULL THEN
      INSERT INTO public.organizations (name, status)
      VALUES (trim(p.organization), 'Active')
      ON CONFLICT (lower(name)) DO UPDATE SET name = EXCLUDED.name
      RETURNING id INTO org_id;
    END IF;
  END IF;

  INSERT INTO public.employees (
    profile_id, name, email, position, department, hire_date, birthday,
    status, phone, avatar, organization_id, performance_score
  ) VALUES (
    p.id, p.name, p.email, p.position, p.department, CURRENT_DATE, p.birthday,
    p.status, p.phone, p.avatar_url, org_id, 0
  )
  ON CONFLICT (profile_id) WHERE profile_id IS NOT NULL DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    position = EXCLUDED.position,
    department = EXCLUDED.department,
    birthday = EXCLUDED.birthday,
    status = EXCLUDED.status,
    phone = EXCLUDED.phone,
    avatar = EXCLUDED.avatar,
    organization_id = EXCLUDED.organization_id,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_employee_from_profile_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.sync_employee_from_profile(OLD.id);
    RETURN OLD;
  END IF;

  PERFORM public.sync_employee_from_profile(NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_employee_from_role_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.sync_employee_from_profile(OLD.user_id);
    RETURN OLD;
  END IF;

  PERFORM public.sync_employee_from_profile(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_employee_profile_changes ON public.profiles;
CREATE TRIGGER sync_employee_profile_changes
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_employee_from_profile_trigger();

DROP TRIGGER IF EXISTS sync_employee_role_changes ON public.user_roles;
CREATE TRIGGER sync_employee_role_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_employee_from_role_trigger();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_roles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'employees'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
  END IF;
END $$;