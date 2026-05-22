-- Fix 1: Restrict shooting_request_history SELECT to participants/admins only
DROP POLICY IF EXISTS srh_select ON public.shooting_request_history;
CREATE POLICY srh_select ON public.shooting_request_history
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shooting_requests r
    WHERE r.id = shooting_request_history.request_id
      AND (
        r.requester_id = auth.uid()
        OR r.assignee_id = auth.uid()
        OR r.moderator_id = auth.uid()
        OR r.director_id = auth.uid()
        OR r.tech_supply_id = auth.uid()
        OR r.driver_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'shooting_moderator'::app_role)
        OR has_role(auth.uid(), 'director'::app_role)
        OR has_role(auth.uid(), 'tech_supply'::app_role)
        OR has_role(auth.uid(), 'driver'::app_role)
      )
  )
);

-- Fix 2: Scope Realtime broadcast subscriptions for documents and conversations topics
-- Restrict realtime.messages SELECT so users can only subscribe to topics they're permitted to read.
DROP POLICY IF EXISTS "Authenticated can receive only their doc broadcasts" ON realtime.messages;
CREATE POLICY "Authenticated can receive only their doc broadcasts"
ON realtime.messages
FOR SELECT TO authenticated
USING (
  realtime.topic() NOT LIKE 'documents:%'
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id::text = split_part(realtime.topic(), ':', 2)
      AND (d.owner_id = auth.uid() OR d.approver_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Authenticated can receive only their conversation broadcasts" ON realtime.messages;
CREATE POLICY "Authenticated can receive only their conversation broadcasts"
ON realtime.messages
FOR SELECT TO authenticated
USING (
  realtime.topic() NOT LIKE 'conversations:%'
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.user_id = auth.uid()
      AND cm.conversation_id::text = split_part(realtime.topic(), ':', 2)
  )
);
