
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-guests can view announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (NOT public.has_role(auth.uid(), 'guest'::app_role));

CREATE POLICY "Admins can insert announcements"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update announcements"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete announcements"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
