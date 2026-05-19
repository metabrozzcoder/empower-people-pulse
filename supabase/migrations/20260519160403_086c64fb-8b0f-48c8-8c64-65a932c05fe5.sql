
-- ============ PROFILES ============
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;

CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- Safe view (no email / phone) for general listings
CREATE OR REPLACE VIEW public.profiles_public AS
  SELECT id, name, avatar_url, position, department, organization, status, preferred_language, created_at
  FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated, anon;

-- ============ DEPARTMENTS ============
DROP POLICY IF EXISTS dept_select ON public.departments;

CREATE POLICY dept_select_admin
  ON public.departments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.departments_public AS
  SELECT id, name, description, manager_name, status, organization_id, created_at
  FROM public.departments;

GRANT SELECT ON public.departments_public TO authenticated;

-- ============ ORGANIZATIONS ============
DROP POLICY IF EXISTS org_select ON public.organizations;

CREATE POLICY org_select_admin
  ON public.organizations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.organizations_public AS
  SELECT id, name, description, status, created_at
  FROM public.organizations;

GRANT SELECT ON public.organizations_public TO authenticated;

-- ============ REALTIME MESSAGES AUTHZ ============
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can receive only their conv broadcasts" ON realtime.messages;
CREATE POLICY "Authenticated can receive only their conv broadcasts"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.conversation_id::text = realtime.topic()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- ============ STORAGE: AVATARS bucket hardening ============
-- Restrict listing/management to the owner's folder; public reads still work
-- via the bucket's public flag (served outside RLS).
DROP POLICY IF EXISTS "Avatars: users manage own folder" ON storage.objects;
CREATE POLICY "Avatars: users manage own folder"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============ SECURITY DEFINER function exposure ============
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
