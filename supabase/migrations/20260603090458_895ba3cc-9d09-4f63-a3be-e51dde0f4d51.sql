
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.assistant_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_threads TO authenticated;
GRANT ALL ON public.assistant_threads TO service_role;
ALTER TABLE public.assistant_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own threads select" ON public.assistant_threads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own threads insert" ON public.assistant_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own threads update" ON public.assistant_threads FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own threads delete" ON public.assistant_threads FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_assistant_threads_updated BEFORE UPDATE ON public.assistant_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.assistant_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_messages TO authenticated;
GRANT ALL ON public.assistant_messages TO service_role;
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own msgs select" ON public.assistant_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own msgs insert" ON public.assistant_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own msgs delete" ON public.assistant_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_thread ON public.assistant_messages(thread_id, created_at);

CREATE TABLE IF NOT EXISTS public.assistant_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('bookmark','note','document','photo')),
  title TEXT,
  content TEXT,
  url TEXT,
  storage_path TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_items TO authenticated;
GRANT ALL ON public.assistant_items TO service_role;
ALTER TABLE public.assistant_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own items select" ON public.assistant_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own items insert" ON public.assistant_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own items update" ON public.assistant_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own items delete" ON public.assistant_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_items_user_kind ON public.assistant_items(user_id, kind, created_at DESC);
CREATE TRIGGER trg_assistant_items_updated BEFORE UPDATE ON public.assistant_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
