
-- 1. Fix function search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Prevent privilege self-escalation via profile update.
-- Replace permissive self-update with one that blocks changes to privilege columns.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE OR REPLACE FUNCTION public.profile_privilege_fields_unchanged(_id uuid, _permissions jsonb, _allowed_sections jsonb, _section_access jsonb)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _id
      AND p.permissions IS NOT DISTINCT FROM _permissions
      AND p.allowed_sections IS NOT DISTINCT FROM _allowed_sections
      AND p.section_access IS NOT DISTINCT FROM _section_access
  );
$$;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND public.profile_privilege_fields_unchanged(id, permissions, allowed_sections, section_access)
);

-- 3. Restrict storage writes on 'vehicles' bucket to admins only.
DROP POLICY IF EXISTS "Authenticated upload vehicle photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update vehicle photos" ON storage.objects;

CREATE POLICY "Admins upload vehicle photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicles' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update vehicle photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'vehicles' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'vehicles' AND public.has_role(auth.uid(), 'admin'::app_role));
