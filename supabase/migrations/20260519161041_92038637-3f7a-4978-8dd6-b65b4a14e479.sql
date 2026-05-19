
-- Tighten shifts SELECT
DROP POLICY IF EXISTS shift_select ON public.shifts;
CREATE POLICY shift_select_scoped
  ON public.shifts FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr')
  );

-- Tighten shooting_requests SELECT
DROP POLICY IF EXISTS sr_select ON public.shooting_requests;
CREATE POLICY sr_select_scoped
  ON public.shooting_requests FOR SELECT TO authenticated
  USING (
    requester_id = auth.uid()
    OR assignee_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr')
  );
