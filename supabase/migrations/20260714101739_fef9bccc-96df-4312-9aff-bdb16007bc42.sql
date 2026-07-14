
DROP POLICY IF EXISTS cr_select ON public.custom_roles;
CREATE POLICY cr_select ON public.custom_roles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));
