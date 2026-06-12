
-- 1. access_rule_users: admin UPDATE
CREATE POLICY "aru_upd" ON public.access_rule_users
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. assistant_messages: owner UPDATE
CREATE POLICY "own msgs update" ON public.assistant_messages
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. custom_roles: admins only SELECT
DROP POLICY IF EXISTS "cr_select" ON public.custom_roles;
CREATE POLICY "cr_select" ON public.custom_roles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. shooting_requests: trigger preventing non-admin changes to sensitive workflow fields
CREATE OR REPLACE FUNCTION public.protect_shooting_request_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.requester_id IS DISTINCT FROM OLD.requester_id
     OR NEW.sensitive IS DISTINCT FROM OLD.sensitive
     OR NEW.assignee_id IS DISTINCT FROM OLD.assignee_id THEN
    RAISE EXCEPTION 'Not allowed to modify protected shooting request fields';
  END IF;

  -- Role-scoped guards: each workflow role may only set their own assignment slot
  IF NEW.moderator_id IS DISTINCT FROM OLD.moderator_id
     AND NOT (public.has_role(auth.uid(), 'shooting_moderator'::app_role)
              AND NEW.moderator_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed to modify moderator_id';
  END IF;

  IF NEW.director_id IS DISTINCT FROM OLD.director_id
     AND NOT (public.has_role(auth.uid(), 'director'::app_role)
              AND NEW.director_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed to modify director_id';
  END IF;

  IF NEW.tech_supply_id IS DISTINCT FROM OLD.tech_supply_id
     AND NOT (public.has_role(auth.uid(), 'tech_supply'::app_role)
              AND NEW.tech_supply_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed to modify tech_supply_id';
  END IF;

  IF NEW.driver_id IS DISTINCT FROM OLD.driver_id
     AND NOT (public.has_role(auth.uid(), 'driver'::app_role)
              AND NEW.driver_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed to modify driver_id';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_shooting_request_fields_trg ON public.shooting_requests;
CREATE TRIGGER protect_shooting_request_fields_trg
BEFORE UPDATE ON public.shooting_requests
FOR EACH ROW EXECUTE FUNCTION public.protect_shooting_request_fields();
