
-- 1. Prevent privilege escalation via self-insert on conversation_members
DROP POLICY IF EXISTS cm_insert ON public.conversation_members;
CREATE POLICY cm_insert ON public.conversation_members
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_members.conversation_id
        AND c.created_by = auth.uid()
    )
  );

-- 2. Allow role-based SELECT on shooting_requests
DROP POLICY IF EXISTS sr_select ON public.shooting_requests;
CREATE POLICY sr_select ON public.shooting_requests
  FOR SELECT TO authenticated
  USING (
    requester_id = auth.uid()
    OR assignee_id = auth.uid()
    OR moderator_id = auth.uid()
    OR director_id = auth.uid()
    OR tech_supply_id = auth.uid()
    OR driver_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (workflow_status = 'pending_moderator' AND has_role(auth.uid(), 'shooting_moderator'::app_role))
    OR (workflow_status = 'pending_director' AND has_role(auth.uid(), 'director'::app_role))
    OR (workflow_status = 'pending_equipment' AND has_role(auth.uid(), 'tech_supply'::app_role))
    OR (workflow_status IN ('pending_driver','scheduled') AND has_role(auth.uid(), 'driver'::app_role))
  );

-- 3. Remove conflicting realtime policy; keep the conversations:%-prefixed one
DROP POLICY IF EXISTS "Authenticated can receive only their conv broadcasts" ON realtime.messages;
