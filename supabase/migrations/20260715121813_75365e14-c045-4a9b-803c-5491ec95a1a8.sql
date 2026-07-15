
DROP POLICY IF EXISTS emp_select_all_auth ON public.employees;
CREATE POLICY emp_select_admin_hr_self ON public.employees
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'hr'::app_role)
    OR profile_id = auth.uid()
  );

DROP POLICY IF EXISTS dept_select_all_auth ON public.departments;
CREATE POLICY dept_select_admin_hr_manager ON public.departments
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'hr'::app_role)
    OR manager_id = auth.uid()
  );

DROP POLICY IF EXISTS org_select_all_auth ON public.organizations;
CREATE POLICY org_select_admin_hr ON public.organizations
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'hr'::app_role)
  );
