
CREATE TABLE IF NOT EXISTS public.ride_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  pickup_location text NOT NULL,
  dropoff_location text NOT NULL,
  pickup_time timestamptz NOT NULL,
  purpose text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id uuid,
  assigned_by uuid,
  assigned_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ride_orders TO authenticated;
GRANT ALL ON public.ride_orders TO service_role;

ALTER TABLE public.ride_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requesters view own ride orders"
  ON public.ride_orders FOR SELECT TO authenticated
  USING (requester_id = auth.uid());

CREATE POLICY "Assigned driver views ride orders"
  ON public.ride_orders FOR SELECT TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Admins and head_of_drivers view all ride orders"
  ON public.ride_orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'head_of_drivers'::app_role));

CREATE POLICY "Users create own ride orders"
  ON public.ride_orders FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid() AND status = 'pending');

CREATE POLICY "Requesters update own pending"
  ON public.ride_orders FOR UPDATE TO authenticated
  USING (requester_id = auth.uid() AND status IN ('pending','assigned'))
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Driver updates assigned ride"
  ON public.ride_orders FOR UPDATE TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Admins and head_of_drivers manage ride orders"
  ON public.ride_orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'head_of_drivers'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'head_of_drivers'::app_role));

CREATE POLICY "Admins delete ride orders"
  ON public.ride_orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_ride_orders_updated_at
  BEFORE UPDATE ON public.ride_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_ride_orders_status ON public.ride_orders(status);
CREATE INDEX IF NOT EXISTS idx_ride_orders_requester ON public.ride_orders(requester_id);
CREATE INDEX IF NOT EXISTS idx_ride_orders_driver ON public.ride_orders(driver_id);
