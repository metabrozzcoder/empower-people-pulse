-- 1) Projects & Tasks: drop permissive policies, leave the scoped ones
DROP POLICY IF EXISTS proj_select ON public.projects;
DROP POLICY IF EXISTS task_select ON public.tasks;

-- 2) admin_user_credentials: revoke direct admin reads of plaintext passwords.
-- Service role retains full access for edge-function one-time delivery.
DROP POLICY IF EXISTS "Admins can read credentials" ON public.admin_user_credentials;

-- Provide a masked view admins can use safely (no plaintext exposure).
CREATE OR REPLACE VIEW public.admin_user_credentials_masked
WITH (security_invoker = true) AS
SELECT
  user_id,
  created_at,
  updated_at,
  CASE
    WHEN public.has_role(auth.uid(), 'admin'::app_role) THEN
      repeat('•', 8) || right(generated_password, 2)
    ELSE NULL
  END AS password_hint
FROM public.admin_user_credentials
WHERE public.has_role(auth.uid(), 'admin'::app_role);

GRANT SELECT ON public.admin_user_credentials_masked TO authenticated;