
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_members TO authenticated;
GRANT ALL ON public.conversation_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;

-- Allow all authenticated users to view organizations (read-only for non-admins)
DROP POLICY IF EXISTS org_select_all ON public.organizations;
CREATE POLICY org_select_all ON public.organizations
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
