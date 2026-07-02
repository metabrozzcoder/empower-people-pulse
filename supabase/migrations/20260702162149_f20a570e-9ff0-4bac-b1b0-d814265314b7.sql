
-- Restrict SELECT visibility of organizations and departments to admins + assigned users only
DROP POLICY IF EXISTS org_select_all ON public.organizations;

CREATE POLICY org_select_assigned
  ON public.organizations FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(coalesce(p.organization, '')) = lower(organizations.name)
    )
  );

CREATE POLICY dept_select_assigned
  ON public.departments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(coalesce(p.department, '')) = lower(departments.name)
    )
  );
