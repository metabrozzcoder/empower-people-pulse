DROP POLICY IF EXISTS conv_select_member ON public.conversations;
CREATE POLICY conv_select_member ON public.conversations
  FOR SELECT TO authenticated
  USING (
    is_conversation_member(id, auth.uid())
    OR created_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS cm_select ON public.conversation_members;
CREATE POLICY cm_select ON public.conversation_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_conversation_member(conversation_id, auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_members.conversation_id AND c.created_by = auth.uid())
  );