CREATE OR REPLACE FUNCTION public.set_user_system_role(_user_id uuid, _role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update system roles';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  DELETE FROM public.user_roles
  WHERE user_id = _user_id
    AND role <> _role;
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_system_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_system_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_system_role(uuid, public.app_role) TO service_role;