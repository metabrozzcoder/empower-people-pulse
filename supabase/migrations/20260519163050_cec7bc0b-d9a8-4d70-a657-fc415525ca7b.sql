-- Extend shooting_requests with workflow fields
ALTER TABLE public.shooting_requests
  ADD COLUMN IF NOT EXISTS workflow_status text NOT NULL DEFAULT 'pending_moderator',
  ADD COLUMN IF NOT EXISTS sensitive boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS moderator_id uuid,
  ADD COLUMN IF NOT EXISTS moderator_note text,
  ADD COLUMN IF NOT EXISTS moderator_decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS director_id uuid,
  ADD COLUMN IF NOT EXISTS director_note text,
  ADD COLUMN IF NOT EXISTS director_decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS tech_supply_id uuid,
  ADD COLUMN IF NOT EXISTS equipment_note text,
  ADD COLUMN IF NOT EXISTS equipment_assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS driver_id uuid,
  ADD COLUMN IF NOT EXISTS vehicle_info text,
  ADD COLUMN IF NOT EXISTS driver_assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS decline_reason text;

-- History/audit table
CREATE TABLE IF NOT EXISTS public.shooting_request_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.shooting_requests(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL,
  from_status text,
  to_status text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shooting_request_history ENABLE ROW LEVEL SECURITY;

-- Replace existing shooting_requests policies with workflow-aware ones
DROP POLICY IF EXISTS sr_select_scoped ON public.shooting_requests;
DROP POLICY IF EXISTS sr_ins ON public.shooting_requests;
DROP POLICY IF EXISTS sr_upd ON public.shooting_requests;
DROP POLICY IF EXISTS sr_del ON public.shooting_requests;

-- INSERT: any authenticated user creating their own request
CREATE POLICY sr_ins ON public.shooting_requests
  FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

-- SELECT: requester, any assigned actor, role holders for the relevant stage, admin
CREATE POLICY sr_select ON public.shooting_requests
  FOR SELECT TO authenticated
  USING (
    requester_id = auth.uid()
    OR assignee_id = auth.uid()
    OR moderator_id = auth.uid()
    OR director_id = auth.uid()
    OR tech_supply_id = auth.uid()
    OR driver_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'shooting_moderator'::app_role)
    OR public.has_role(auth.uid(), 'director'::app_role)
    OR public.has_role(auth.uid(), 'tech_supply'::app_role)
    OR public.has_role(auth.uid(), 'driver'::app_role)
  );

-- UPDATE: admin always; otherwise the role responsible for the current workflow stage
CREATE POLICY sr_upd ON public.shooting_requests
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (workflow_status = 'pending_moderator' AND public.has_role(auth.uid(), 'shooting_moderator'::app_role))
    OR (workflow_status = 'pending_director'  AND public.has_role(auth.uid(), 'director'::app_role))
    OR (workflow_status = 'pending_equipment' AND public.has_role(auth.uid(), 'tech_supply'::app_role))
    OR (workflow_status = 'pending_driver'    AND public.has_role(auth.uid(), 'driver'::app_role))
    OR (workflow_status = 'scheduled'         AND (driver_id = auth.uid() OR public.has_role(auth.uid(), 'driver'::app_role)))
  );

-- DELETE: requester (while still pending_moderator) or admin
CREATE POLICY sr_del ON public.shooting_requests
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (requester_id = auth.uid() AND workflow_status = 'pending_moderator')
  );

-- History policies: visible to anyone who can see the parent request; insert by any authenticated whose action is being recorded
CREATE POLICY srh_select ON public.shooting_request_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shooting_requests r
      WHERE r.id = shooting_request_history.request_id
    )
  );

CREATE POLICY srh_ins ON public.shooting_request_history
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_srh_request ON public.shooting_request_history(request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sr_workflow ON public.shooting_requests(workflow_status);