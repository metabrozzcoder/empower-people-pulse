
-- Documents: add fields needed by the Documentation UI
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'Normal',
  ADD COLUMN IF NOT EXISTS receiver_name text,
  ALTER COLUMN file_path DROP NOT NULL;

-- Allow approver column to be set when status='pending' by submitter
-- (existing RLS already permits owner & approver to update)

-- Make file_type/size already nullable. Good.

-- Enable realtime
ALTER TABLE public.documents REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='documents';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.documents';
  END IF;
END $$;

-- User settings table for per-user notification & app preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY,
  notifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  security jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "us_select_own" ON public.user_settings;
CREATE POLICY "us_select_own" ON public.user_settings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "us_insert_own" ON public.user_settings;
CREATE POLICY "us_insert_own" ON public.user_settings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "us_update_own" ON public.user_settings;
CREATE POLICY "us_update_own" ON public.user_settings FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "us_delete_own" ON public.user_settings;
CREATE POLICY "us_delete_own" ON public.user_settings FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS user_settings_updated_at ON public.user_settings;
CREATE TRIGGER user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
