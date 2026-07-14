
-- Allow all authenticated users to view departments, organizations, and the employees directory
DROP POLICY IF EXISTS dept_select_admin ON public.departments;
DROP POLICY IF EXISTS dept_select_assigned ON public.departments;
CREATE POLICY dept_select_all_auth ON public.departments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS org_select_admin ON public.organizations;
DROP POLICY IF EXISTS org_select_assigned ON public.organizations;
CREATE POLICY org_select_all_auth ON public.organizations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS emp_select_admin_hr ON public.employees;
DROP POLICY IF EXISTS emp_select_self ON public.employees;
CREATE POLICY emp_select_all_auth ON public.employees FOR SELECT TO authenticated USING (true);
