
-- 1. Notifications: only admins can insert directly; SECURITY DEFINER trigger function still works
DROP POLICY IF EXISTS notif_insert_any ON public.notifications;
CREATE POLICY notif_insert_admin ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Profiles: replace blanket SELECT with self + admin scope
DROP POLICY IF EXISTS "Authenticated can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Realtime channel policy for notifications:<user_id> topics
CREATE POLICY "Authenticated can receive only their notification broadcasts"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    realtime.topic() NOT LIKE 'notifications:%'
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR split_part(realtime.topic(), ':', 2) = auth.uid()::text
  );

-- 4. Shooting requests: restrict requester INSERT to safe defaults only
DROP POLICY IF EXISTS sr_ins ON public.shooting_requests;
CREATE POLICY sr_ins ON public.shooting_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND workflow_status = 'pending_moderator'
    AND moderator_id IS NULL
    AND director_id IS NULL
    AND tech_supply_id IS NULL
    AND driver_id IS NULL
    AND sensitive = false
  );
