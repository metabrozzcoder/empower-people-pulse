
-- 1) Tighten shooting_request_history insert policy
DROP POLICY IF EXISTS srh_ins ON public.shooting_request_history;
CREATE POLICY srh_ins ON public.shooting_request_history
FOR INSERT TO authenticated
WITH CHECK (
  (actor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.shooting_requests r
      WHERE r.id = shooting_request_history.request_id
        AND (
          r.requester_id = auth.uid()
          OR r.assignee_id = auth.uid()
          OR r.moderator_id = auth.uid()
          OR r.director_id = auth.uid()
          OR r.tech_supply_id = auth.uid()
          OR r.driver_id = auth.uid()
        )
    )
  )
);

-- 2) Extend trigger to also block non-admin edits to core content fields
CREATE OR REPLACE FUNCTION public.protect_shooting_request_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Always-protected fields (never editable by non-admins via RLS update path)
  IF NEW.requester_id IS DISTINCT FROM OLD.requester_id
     OR NEW.sensitive IS DISTINCT FROM OLD.sensitive
     OR NEW.assignee_id IS DISTINCT FROM OLD.assignee_id
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.description IS DISTINCT FROM OLD.description
     OR NEW.location IS DISTINCT FROM OLD.location
     OR NEW.scheduled_date IS DISTINCT FROM OLD.scheduled_date
     OR NEW.equipment IS DISTINCT FROM OLD.equipment THEN
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
$function$;

-- 3) Restrict vehicles SELECT to admins and assigned driver
DROP POLICY IF EXISTS veh_select ON public.vehicles;
CREATE POLICY veh_select ON public.vehicles
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR assigned_driver_id = auth.uid()
);
