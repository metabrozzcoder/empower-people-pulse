-- Workspaces for real-time employee collaboration
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'editor',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT ALL ON public.workspace_members TO service_role;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_workspace_member(_ws uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = _ws AND user_id = _user)
      OR EXISTS (SELECT 1 FROM public.workspaces WHERE id = _ws AND created_by = _user);
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_owner(_ws uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workspaces WHERE id = _ws AND created_by = _user)
      OR EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = _ws AND user_id = _user AND role = 'owner');
$$;

CREATE POLICY "Members view workspaces" ON public.workspaces FOR SELECT TO authenticated
  USING (public.is_workspace_member(id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users create workspaces" ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Owners update workspaces" ON public.workspaces FOR UPDATE TO authenticated
  USING (public.is_workspace_owner(id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners delete workspaces" ON public.workspaces FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Members view members" ON public.workspace_members FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners add members" ON public.workspace_members FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_owner(workspace_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners update members" ON public.workspace_members FOR UPDATE TO authenticated
  USING (public.is_workspace_owner(workspace_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners remove members" ON public.workspace_members FOR DELETE TO authenticated
  USING (public.is_workspace_owner(workspace_id, auth.uid()) OR public.has_role(auth.uid(),'admin') OR user_id = auth.uid());

-- Collaborative documents
CREATE TABLE public.workspace_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled',
  content_html text NOT NULL DEFAULT '',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_docs TO authenticated;
GRANT ALL ON public.workspace_docs TO service_role;
ALTER TABLE public.workspace_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage docs" ON public.workspace_docs FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()))
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));

-- Shared tables / sheets
CREATE TABLE public.workspace_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled table',
  columns jsonb NOT NULL DEFAULT '["Column A","Column B","Column C"]'::jsonb,
  rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_sheets TO authenticated;
GRANT ALL ON public.workspace_sheets TO service_role;
ALTER TABLE public.workspace_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage sheets" ON public.workspace_sheets FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()))
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));

-- Kanban board cards
CREATE TABLE public.workspace_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  column_key text NOT NULL DEFAULT 'todo',
  order_index integer NOT NULL DEFAULT 0,
  assignee_id uuid,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_cards TO authenticated;
GRANT ALL ON public.workspace_cards TO service_role;
ALTER TABLE public.workspace_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage cards" ON public.workspace_cards FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()))
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));

-- Comments with mentions
CREATE TABLE public.workspace_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  target_type text NOT NULL DEFAULT 'workspace',
  target_id uuid,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  body text NOT NULL,
  mentions uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_comments TO authenticated;
GRANT ALL ON public.workspace_comments TO service_role;
ALTER TABLE public.workspace_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view comments" ON public.workspace_comments FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Members add comments" ON public.workspace_comments FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND user_id = auth.uid());
CREATE POLICY "Authors edit comments" ON public.workspace_comments FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Authors delete comments" ON public.workspace_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_workspace_owner(workspace_id, auth.uid()));

-- updated_at triggers
CREATE TRIGGER trg_workspaces_updated BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_workspace_docs_updated BEFORE UPDATE ON public.workspace_docs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_workspace_sheets_updated BEFORE UPDATE ON public.workspace_sheets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_workspace_cards_updated BEFORE UPDATE ON public.workspace_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notify on mention
CREATE OR REPLACE FUNCTION public.notify_workspace_mention()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m uuid; actor text; ws text;
BEGIN
  SELECT name INTO actor FROM public.profiles WHERE id = NEW.user_id;
  SELECT title INTO ws FROM public.workspaces WHERE id = NEW.workspace_id;
  FOREACH m IN ARRAY NEW.mentions LOOP
    PERFORM public.create_notification(m, NEW.user_id, 'workspace_mention',
      COALESCE(actor,'Someone') || ' mentioned you' || COALESCE(' in ' || ws, ''),
      left(NEW.body, 140), '/#/documentation', 'workspace', NEW.workspace_id);
  END LOOP;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_workspace_comment_mention AFTER INSERT ON public.workspace_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_workspace_mention();

-- Realtime
ALTER TABLE public.workspace_docs REPLICA IDENTITY FULL;
ALTER TABLE public.workspace_sheets REPLICA IDENTITY FULL;
ALTER TABLE public.workspace_cards REPLICA IDENTITY FULL;
ALTER TABLE public.workspace_comments REPLICA IDENTITY FULL;
ALTER TABLE public.workspace_members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_docs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_sheets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_members;