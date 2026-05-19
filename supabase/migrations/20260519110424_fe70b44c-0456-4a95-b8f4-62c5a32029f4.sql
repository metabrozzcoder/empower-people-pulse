
-- ============== EMPLOYEES ==============
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  position TEXT,
  department TEXT,
  hire_date DATE,
  birthday DATE,
  salary NUMERIC,
  status TEXT DEFAULT 'Active',
  phone TEXT,
  location TEXT,
  manager TEXT,
  performance_score INT,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emp_select" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "emp_admin_ins" ON public.employees FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "emp_admin_upd" ON public.employees FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "emp_admin_del" ON public.employees FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER emp_upd BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== PROJECTS ==============
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Planning',
  progress INT DEFAULT 0,
  due_date DATE,
  team JSONB DEFAULT '[]'::jsonb,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proj_select" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "proj_admin_ins" ON public.projects FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "proj_admin_upd" ON public.projects FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR owner_id = auth.uid());
CREATE POLICY "proj_admin_del" ON public.projects FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER proj_upd BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== TASKS ==============
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  order_index INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "task_select" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "task_ins" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "task_upd" ON public.tasks FOR UPDATE TO authenticated USING (assignee_id = auth.uid() OR created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "task_del" ON public.tasks FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER task_upd_t BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== SHOOTING REQUESTS ==============
CREATE TABLE public.shooting_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  scheduled_date DATE,
  status TEXT DEFAULT 'pending',
  requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  equipment JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shooting_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sr_select" ON public.shooting_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "sr_ins" ON public.shooting_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "sr_upd" ON public.shooting_requests FOR UPDATE TO authenticated USING (requester_id = auth.uid() OR assignee_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "sr_del" ON public.shooting_requests FOR DELETE TO authenticated USING (requester_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER sr_upd_t BEFORE UPDATE ON public.shooting_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== ATTENDANCE ==============
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'present',
  hours NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "att_select_own" ON public.attendance FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "att_ins_own" ON public.attendance FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "att_upd_own" ON public.attendance FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ============== DOCUMENTS ==============
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approver_comment TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_select" ON public.documents FOR SELECT TO authenticated USING (
  owner_id = auth.uid() OR approver_id = auth.uid() OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "doc_ins_own" ON public.documents FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "doc_upd" ON public.documents FOR UPDATE TO authenticated USING (
  owner_id = auth.uid() OR approver_id = auth.uid() OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "doc_del" ON public.documents FOR DELETE TO authenticated USING (
  owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')
);
CREATE TRIGGER doc_upd_t BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== CHAT ==============
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  is_group BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  forwarded BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER msg_upd_t BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX msg_conv_idx ON public.messages(conversation_id, created_at);

-- Helper to avoid RLS recursion on conversation_members
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conv UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = _conv AND user_id = _user)
$$;

CREATE POLICY "conv_select_member" ON public.conversations FOR SELECT TO authenticated
  USING (public.is_conversation_member(id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "conv_insert" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "conv_update_admin" ON public.conversations FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "conv_delete_admin" ON public.conversations FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "cm_select" ON public.conversation_members FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "cm_insert" ON public.conversation_members FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
    OR user_id = auth.uid()
  );
CREATE POLICY "cm_delete" ON public.conversation_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "msg_select_member" ON public.messages FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "msg_insert_member" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "msg_update_own" ON public.messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "msg_delete_admin" ON public.messages FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- Realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;

-- ============== STORAGE BUCKETS ==============
INSERT INTO storage.buckets (id, name, public) VALUES ('documents','documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars','avatars', true) ON CONFLICT DO NOTHING;

-- avatars policies (public read; owner writes their own folder)
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_user_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_user_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_user_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- documents bucket policies: only owner or assigned approver or admin can read
-- We rely on path layout: <owner_id>/<doc_id>/<filename>
CREATE POLICY "docs_owner_read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents' AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(),'admin')
      OR EXISTS (
        SELECT 1 FROM public.documents d
        WHERE d.file_path = name AND (d.approver_id = auth.uid())
      )
    )
  );
CREATE POLICY "docs_owner_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "docs_owner_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "docs_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));
