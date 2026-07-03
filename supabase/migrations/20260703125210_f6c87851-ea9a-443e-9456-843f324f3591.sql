DROP POLICY IF EXISTS "HR can view all profiles" ON public.profiles;
CREATE POLICY "HR can view all profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'hr'::app_role));