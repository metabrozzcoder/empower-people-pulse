
-- Auto-log completed ride orders as vehicle trips so garage stays in sync
CREATE OR REPLACE FUNCTION public.ride_order_to_vehicle_trip()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current numeric;
BEGIN
  IF NEW.status = 'completed'
     AND (OLD.status IS DISTINCT FROM 'completed')
     AND NEW.vehicle_id IS NOT NULL
     AND NEW.driver_id IS NOT NULL THEN
    SELECT current_mileage INTO v_current FROM public.vehicles WHERE id = NEW.vehicle_id;
    INSERT INTO public.vehicle_trips (vehicle_id, driver_id, trip_date, start_mileage, status, notes)
    VALUES (
      NEW.vehicle_id,
      NEW.driver_id,
      COALESCE(NEW.completed_at, now()),
      COALESCE(v_current, 0),
      'completed',
      'Ride order: ' || NEW.pickup_location || ' → ' || NEW.dropoff_location
        || COALESCE(' (' || NEW.purpose || ')', '')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ride_order_to_vehicle_trip ON public.ride_orders;
CREATE TRIGGER trg_ride_order_to_vehicle_trip
AFTER UPDATE ON public.ride_orders
FOR EACH ROW EXECUTE FUNCTION public.ride_order_to_vehicle_trip();

-- Notify requester and driver on ride order lifecycle events
CREATE OR REPLACE FUNCTION public.notify_ride_order_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.driver_id IS NOT NULL
     AND NEW.driver_id IS DISTINCT FROM OLD.driver_id THEN
    PERFORM public.create_notification(
      NEW.driver_id, auth.uid(), 'ride_assigned',
      'Ride assigned to you',
      NEW.pickup_location || ' → ' || NEW.dropoff_location,
      '/#/ride-orders', 'ride_order', NEW.id
    );
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.status IS DISTINCT FROM OLD.status
     AND NEW.requester_id IS NOT NULL THEN
    PERFORM public.create_notification(
      NEW.requester_id, auth.uid(), 'ride_status_changed',
      'Ride ' || replace(NEW.status, '_', ' '),
      NEW.pickup_location || ' → ' || NEW.dropoff_location,
      '/#/ride-orders', 'ride_order', NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_ride_order_event ON public.ride_orders;
CREATE TRIGGER trg_notify_ride_order_event
AFTER UPDATE ON public.ride_orders
FOR EACH ROW EXECUTE FUNCTION public.notify_ride_order_event();

-- Ensure ride_orders is on realtime publication
ALTER TABLE public.ride_orders REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ride_orders'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_orders';
  END IF;
END $$;
