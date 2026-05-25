-- Custom roles
CREATE TABLE public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  allowed_sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  workflow_slot text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY cr_select ON public.custom_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY cr_ins ON public.custom_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY cr_upd ON public.custom_roles FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY cr_del ON public.custom_roles FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_custom_roles_updated BEFORE UPDATE ON public.custom_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User <-> custom role assignment
CREATE TABLE public.user_custom_roles (
  user_id uuid NOT NULL,
  custom_role_id uuid NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, custom_role_id)
);
ALTER TABLE public.user_custom_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY ucr_select ON public.user_custom_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY ucr_ins ON public.user_custom_roles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY ucr_del ON public.user_custom_roles FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

-- Vehicles
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number text NOT NULL UNIQUE,
  model text,
  make text,
  year integer,
  color text,
  photo_url text,
  current_mileage numeric NOT NULL DEFAULT 0,
  assigned_driver_id uuid,
  status text NOT NULL DEFAULT 'Active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY veh_select ON public.vehicles FOR SELECT TO authenticated
  USING (true);
CREATE POLICY veh_ins ON public.vehicles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY veh_upd ON public.vehicles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR assigned_driver_id = auth.uid());
CREATE POLICY veh_del ON public.vehicles FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vehicle trips
CREATE TABLE public.vehicle_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL,
  shooting_request_id uuid REFERENCES public.shooting_requests(id) ON DELETE SET NULL,
  trip_date date NOT NULL DEFAULT CURRENT_DATE,
  start_mileage numeric NOT NULL DEFAULT 0,
  end_mileage numeric,
  miles_driven numeric GENERATED ALWAYS AS (COALESCE(end_mileage,0) - COALESCE(start_mileage,0)) STORED,
  plate_photo_url text,
  odometer_start_photo_url text,
  odometer_end_photo_url text,
  notes text,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicle_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY trip_select ON public.vehicle_trips FOR SELECT TO authenticated
  USING (driver_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role) OR EXISTS (
    SELECT 1 FROM public.shooting_requests sr WHERE sr.id = shooting_request_id
      AND (sr.requester_id = auth.uid() OR sr.moderator_id = auth.uid() OR sr.director_id = auth.uid() OR sr.tech_supply_id = auth.uid())
  ));
CREATE POLICY trip_ins ON public.vehicle_trips FOR INSERT TO authenticated
  WITH CHECK (driver_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY trip_upd ON public.vehicle_trips FOR UPDATE TO authenticated
  USING (driver_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY trip_del ON public.vehicle_trips FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_trips_updated BEFORE UPDATE ON public.vehicle_trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: when a trip is completed, update vehicle's current_mileage
CREATE OR REPLACE FUNCTION public.sync_vehicle_mileage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.end_mileage IS NOT NULL AND NEW.end_mileage > 0 THEN
    UPDATE public.vehicles SET current_mileage = NEW.end_mileage, updated_at = now()
    WHERE id = NEW.vehicle_id AND current_mileage < NEW.end_mileage;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_trip_sync_mileage AFTER INSERT OR UPDATE ON public.vehicle_trips
  FOR EACH ROW EXECUTE FUNCTION public.sync_vehicle_mileage();

-- Storage bucket for vehicle photos
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicles','vehicles', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Vehicle photos public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicles');
CREATE POLICY "Authenticated upload vehicle photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicles');
CREATE POLICY "Authenticated update vehicle photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vehicles');
CREATE POLICY "Admins delete vehicle photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vehicles' AND has_role(auth.uid(),'admin'::app_role));