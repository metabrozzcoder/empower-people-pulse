CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TEXT,
  type TEXT NOT NULL DEFAULT 'reminder',
  color TEXT DEFAULT 'blue',
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rem_select_own" ON public.reminders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "rem_insert_own" ON public.reminders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "rem_update_own" ON public.reminders FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "rem_delete_own" ON public.reminders FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_reminders_user_date ON public.reminders(user_id, date);