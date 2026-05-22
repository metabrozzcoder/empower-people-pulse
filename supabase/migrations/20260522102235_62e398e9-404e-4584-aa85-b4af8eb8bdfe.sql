-- Allow authenticated users to view all profiles (needed for chat recipient list and user management visibility)
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;

CREATE POLICY "Authenticated can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);