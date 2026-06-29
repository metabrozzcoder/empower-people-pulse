
-- Tighten projects SELECT: owner, team members, or admin/hr
DROP POLICY IF EXISTS "Authenticated can read projects" ON public.projects;
DROP POLICY IF EXISTS "projects_select_all" ON public.projects;
DROP POLICY IF EXISTS "projects select" ON public.projects;
DROP POLICY IF EXISTS "Projects are viewable by authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Anyone authenticated can view projects" ON public.projects;

CREATE POLICY "projects_select_scoped" ON public.projects
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'hr'::app_role)
  OR owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(COALESCE(team, '[]'::jsonb)) AS m
    WHERE (m->>'id') = auth.uid()::text
  )
);

-- Tighten tasks SELECT: creator, assignee, admin/hr, or member of related project
DROP POLICY IF EXISTS "Authenticated can read tasks" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_all" ON public.tasks;
DROP POLICY IF EXISTS "tasks select" ON public.tasks;
DROP POLICY IF EXISTS "Tasks are viewable by authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Anyone authenticated can view tasks" ON public.tasks;

CREATE POLICY "tasks_select_scoped" ON public.tasks
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'hr'::app_role)
  OR assignee_id = auth.uid()
  OR created_by = auth.uid()
  OR (
    project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id
        AND (
          p.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(COALESCE(p.team, '[]'::jsonb)) AS m
            WHERE (m->>'id') = auth.uid()::text
          )
        )
    )
  )
);

-- Add explicit admin write policies for admin_user_credentials
CREATE POLICY "admin_creds_insert_admin" ON public.admin_user_credentials
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_creds_update_admin" ON public.admin_user_credentials
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_creds_delete_admin" ON public.admin_user_credentials
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
