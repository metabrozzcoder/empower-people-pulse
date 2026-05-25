
CREATE TABLE IF NOT EXISTS public.access_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('IP_RESTRICTION','TIME_RESTRICTION','LOCATION_RESTRICTION','DEVICE_RESTRICTION')),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY ar_select ON public.access_rules FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY ar_ins ON public.access_rules FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY ar_upd ON public.access_rules FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY ar_del ON public.access_rules FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_access_rules_updated
BEFORE UPDATE ON public.access_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.access_rule_users (
  rule_id uuid NOT NULL REFERENCES public.access_rules(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (rule_id, user_id)
);

ALTER TABLE public.access_rule_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY aru_select ON public.access_rule_users FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR user_id = auth.uid());
CREATE POLICY aru_ins ON public.access_rule_users FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY aru_del ON public.access_rule_users FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_aru_user ON public.access_rule_users(user_id);
CREATE INDEX IF NOT EXISTS idx_aru_rule ON public.access_rule_users(rule_id);
