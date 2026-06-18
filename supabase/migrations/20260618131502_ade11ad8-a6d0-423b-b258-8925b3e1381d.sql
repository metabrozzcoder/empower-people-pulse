
-- ============ payment_orders ============
CREATE TABLE public.payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  department_name text,
  budget numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  due_date date,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected | paid | cancelled
  created_by uuid NOT NULL,
  paid_at timestamptz,
  paid_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_orders TO authenticated;
GRANT ALL ON public.payment_orders TO service_role;

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- ============ payment_order_assignees ============
CREATE TABLE public.payment_order_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_order_id uuid NOT NULL REFERENCES public.payment_orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  note text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payment_order_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_order_assignees TO authenticated;
GRANT ALL ON public.payment_order_assignees TO service_role;

ALTER TABLE public.payment_order_assignees ENABLE ROW LEVEL SECURITY;

-- Security-definer helper: is current user an assignee on this order?
CREATE OR REPLACE FUNCTION public.is_payment_order_assignee(_order uuid, _user uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.payment_order_assignees
    WHERE payment_order_id = _order AND user_id = _user
  );
$$;

-- ============ RLS: payment_orders ============
CREATE POLICY "View own/assigned/accountant orders"
ON public.payment_orders FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'accountant'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_payment_order_assignee(id, auth.uid())
);

CREATE POLICY "Anyone authenticated can create order"
ON public.payment_orders FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creator or accountant can update order"
ON public.payment_orders FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'accountant'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'accountant'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Creator or admin can delete order"
ON public.payment_orders FOR DELETE TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- ============ RLS: payment_order_assignees ============
CREATE POLICY "View assignees if can view order"
ON public.payment_order_assignees FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'accountant'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.payment_orders po
    WHERE po.id = payment_order_id AND po.created_by = auth.uid()
  )
);

CREATE POLICY "Order creator or admin can add assignees"
ON public.payment_order_assignees FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.payment_orders po
    WHERE po.id = payment_order_id AND po.created_by = auth.uid()
  )
);

CREATE POLICY "Assignee can update own decision"
ON public.payment_order_assignees FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Creator or admin can remove assignees"
ON public.payment_order_assignees FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.payment_orders po
    WHERE po.id = payment_order_id AND po.created_by = auth.uid()
  )
);

-- updated_at trigger
CREATE TRIGGER set_payment_orders_updated_at
BEFORE UPDATE ON public.payment_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-roll order status when assignees decide
CREATE OR REPLACE FUNCTION public.sync_payment_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total int;
  approved_count int;
  rejected_count int;
  target_order uuid;
BEGIN
  target_order := COALESCE(NEW.payment_order_id, OLD.payment_order_id);

  SELECT count(*),
         count(*) FILTER (WHERE status = 'approved'),
         count(*) FILTER (WHERE status = 'rejected')
    INTO total, approved_count, rejected_count
  FROM public.payment_order_assignees
  WHERE payment_order_id = target_order;

  IF total = 0 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF rejected_count > 0 THEN
    UPDATE public.payment_orders
       SET status = 'rejected', updated_at = now()
     WHERE id = target_order AND status NOT IN ('paid','cancelled');
  ELSIF approved_count = total THEN
    UPDATE public.payment_orders
       SET status = 'approved', updated_at = now()
     WHERE id = target_order AND status NOT IN ('paid','cancelled');
  ELSE
    UPDATE public.payment_orders
       SET status = 'pending', updated_at = now()
     WHERE id = target_order AND status NOT IN ('paid','cancelled','rejected');
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_payment_order_status
AFTER INSERT OR UPDATE OR DELETE ON public.payment_order_assignees
FOR EACH ROW EXECUTE FUNCTION public.sync_payment_order_status();
