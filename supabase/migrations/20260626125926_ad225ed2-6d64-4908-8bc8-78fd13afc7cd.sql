
-- 1) Employees: restrict SELECT
DROP POLICY IF EXISTS emp_select ON public.employees;
CREATE POLICY emp_select_admin_hr ON public.employees
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'hr'::app_role)
  );
CREATE POLICY emp_select_self ON public.employees
  FOR SELECT TO authenticated
  USING (
    email IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND lower(p.email) = lower(employees.email)
    )
  );

-- 2) Payment orders: restrict INSERT to specific roles
DROP POLICY IF EXISTS "Anyone authenticated can create order" ON public.payment_orders;
CREATE POLICY "Privileged roles can create order" ON public.payment_orders
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'accountant'::app_role)
      OR public.has_role(auth.uid(), 'hr'::app_role)
      OR public.has_role(auth.uid(), 'employee'::app_role)
    )
  );

-- 3) Move generated_password out of profiles
CREATE TABLE IF NOT EXISTS public.admin_user_credentials (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_password text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_user_credentials TO authenticated;
GRANT ALL ON public.admin_user_credentials TO service_role;

ALTER TABLE public.admin_user_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read credentials"
  ON public.admin_user_credentials
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- No INSERT/UPDATE/DELETE policies for authenticated => only service_role (edge functions) can write.

CREATE TRIGGER admin_user_credentials_updated_at
  BEFORE UPDATE ON public.admin_user_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill from existing column, then drop it from profiles
INSERT INTO public.admin_user_credentials (user_id, generated_password)
SELECT id, generated_password FROM public.profiles
WHERE generated_password IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS generated_password;
