
-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  entity_type text,
  entity_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notif_select_own ON public.notifications;
CREATE POLICY notif_select_own ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS notif_update_own ON public.notifications;
CREATE POLICY notif_update_own ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notif_delete_own ON public.notifications;
CREATE POLICY notif_delete_own ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Allow authenticated users to insert notifications for others (e.g. when sending a message client-side)
DROP POLICY IF EXISTS notif_insert_any ON public.notifications;
CREATE POLICY notif_insert_any ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

-- Enable realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications';
  IF NOT FOUND THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- Helper to insert a notification (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid, _actor_id uuid, _type text, _title text,
  _body text, _link text, _entity_type text, _entity_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL OR _user_id = _actor_id THEN RETURN; END IF;
  INSERT INTO public.notifications(user_id, actor_id, type, title, body, link, entity_type, entity_id)
  VALUES (_user_id, _actor_id, _type, _title, _body, _link, _entity_type, _entity_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid,uuid,text,text,text,text,text,uuid) TO authenticated, service_role;

-- ===== Trigger: tasks assignment =====
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_name text;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.assignee_id IS NOT NULL)
     OR (TG_OP = 'UPDATE' AND NEW.assignee_id IS DISTINCT FROM OLD.assignee_id AND NEW.assignee_id IS NOT NULL) THEN
    SELECT name INTO actor_name FROM public.profiles WHERE id = COALESCE(NEW.created_by, auth.uid());
    PERFORM public.create_notification(
      NEW.assignee_id, COALESCE(NEW.created_by, auth.uid()),
      'task_assigned', 'New task assigned',
      COALESCE(actor_name,'Someone') || ' assigned you: ' || NEW.title,
      '/#/tasks', 'task', NEW.id
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_task_assigned ON public.tasks;
CREATE TRIGGER trg_notify_task_assigned AFTER INSERT OR UPDATE OF assignee_id ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.notify_task_assigned();

-- ===== Trigger: new message =====
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_name text; conv_name text; preview text;
BEGIN
  SELECT name INTO actor_name FROM public.profiles WHERE id = NEW.sender_id;
  SELECT name INTO conv_name FROM public.conversations WHERE id = NEW.conversation_id;
  preview := left(NEW.content, 120);
  INSERT INTO public.notifications(user_id, actor_id, type, title, body, link, entity_type, entity_id)
  SELECT cm.user_id, NEW.sender_id, 'new_message',
         COALESCE(actor_name,'New message') || COALESCE(' • '||conv_name,''),
         preview, '/#/chat', 'message', NEW.id
  FROM public.conversation_members cm
  WHERE cm.conversation_id = NEW.conversation_id AND cm.user_id <> NEW.sender_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- ===== Trigger: documents =====
CREATE OR REPLACE FUNCTION public.notify_document_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_name text;
BEGIN
  -- New approval request
  IF (TG_OP = 'INSERT' AND NEW.approver_id IS NOT NULL)
     OR (TG_OP = 'UPDATE' AND NEW.approver_id IS DISTINCT FROM OLD.approver_id AND NEW.approver_id IS NOT NULL) THEN
    SELECT name INTO owner_name FROM public.profiles WHERE id = NEW.owner_id;
    PERFORM public.create_notification(
      NEW.approver_id, NEW.owner_id, 'doc_review_requested',
      'Document needs review',
      COALESCE(owner_name,'Someone') || ' requested review on: ' || NEW.title,
      '/#/documentation', 'document', NEW.id
    );
  END IF;
  -- Status change → notify owner
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.owner_id IS NOT NULL THEN
    PERFORM public.create_notification(
      NEW.owner_id, COALESCE(NEW.approver_id, auth.uid()), 'doc_status_changed',
      'Document ' || NEW.status, NEW.title,
      '/#/documentation', 'document', NEW.id
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_document ON public.documents;
CREATE TRIGGER trg_notify_document AFTER INSERT OR UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.notify_document_event();

-- ===== Trigger: shooting requests =====
CREATE OR REPLACE FUNCTION public.notify_shooting_request_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.workflow_status IS DISTINCT FROM OLD.workflow_status THEN
    -- Always notify requester of progress
    PERFORM public.create_notification(
      NEW.requester_id, auth.uid(), 'shooting_request_update',
      'Shooting request: ' || NEW.workflow_status, NEW.title,
      '/#/shooting-requests', 'shooting_request', NEW.id
    );
  END IF;
  -- Notify assigned people when they become responsible
  IF NEW.moderator_id IS NOT NULL AND NEW.moderator_id IS DISTINCT FROM OLD.moderator_id THEN
    PERFORM public.create_notification(NEW.moderator_id, auth.uid(),'shooting_request_assigned','Request assigned to you',NEW.title,'/#/shooting-requests','shooting_request',NEW.id);
  END IF;
  IF NEW.director_id IS NOT NULL AND NEW.director_id IS DISTINCT FROM OLD.director_id THEN
    PERFORM public.create_notification(NEW.director_id, auth.uid(),'shooting_request_assigned','Request assigned to you',NEW.title,'/#/shooting-requests','shooting_request',NEW.id);
  END IF;
  IF NEW.tech_supply_id IS NOT NULL AND NEW.tech_supply_id IS DISTINCT FROM OLD.tech_supply_id THEN
    PERFORM public.create_notification(NEW.tech_supply_id, auth.uid(),'shooting_request_assigned','Request assigned to you',NEW.title,'/#/shooting-requests','shooting_request',NEW.id);
  END IF;
  IF NEW.driver_id IS NOT NULL AND NEW.driver_id IS DISTINCT FROM OLD.driver_id THEN
    PERFORM public.create_notification(NEW.driver_id, auth.uid(),'shooting_request_assigned','Request assigned to you',NEW.title,'/#/shooting-requests','shooting_request',NEW.id);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_shooting_request ON public.shooting_requests;
CREATE TRIGGER trg_notify_shooting_request AFTER UPDATE ON public.shooting_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_shooting_request_event();

-- ===== Trigger: project ownership =====
CREATE OR REPLACE FUNCTION public.notify_project_assigned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.owner_id IS NOT NULL AND NEW.owner_id <> COALESCE(auth.uid(), NEW.owner_id))
     OR (TG_OP = 'UPDATE' AND NEW.owner_id IS DISTINCT FROM OLD.owner_id AND NEW.owner_id IS NOT NULL) THEN
    PERFORM public.create_notification(
      NEW.owner_id, auth.uid(), 'project_assigned',
      'Project assigned to you', NEW.name,
      '/#/projects', 'project', NEW.id
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_project_assigned ON public.projects;
CREATE TRIGGER trg_notify_project_assigned AFTER INSERT OR UPDATE OF owner_id ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.notify_project_assigned();
