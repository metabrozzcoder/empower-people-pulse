
-- 1) admin_user_credentials: allow admins to read stored generated passwords
CREATE POLICY "Admins can read credentials"
ON public.admin_user_credentials
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) documents: remove anonymous direct SELECT; expose a masked RPC instead
DROP POLICY IF EXISTS doc_select_public ON public.documents;

-- Authenticated users may still list approved public documents
CREATE POLICY "Authenticated can view approved public documents"
ON public.documents
FOR SELECT
TO authenticated
USING (visibility = 'public' AND status = 'approved');

-- SECURITY DEFINER function for anonymous verification page — returns only
-- fields necessary to render the verification view, with owner/approver names
-- resolved server-side so raw UUIDs are not leaked.
CREATE OR REPLACE FUNCTION public.get_public_document(_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  body_html text,
  category text,
  status text,
  visibility text,
  receiver_name text,
  file_path text,
  file_type text,
  created_at timestamptz,
  reviewed_at timestamptz,
  owner_name text,
  approver_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.id, d.title, d.description, d.body_html, d.category, d.status, d.visibility,
    d.receiver_name, d.file_path, d.file_type, d.created_at, d.reviewed_at,
    op.name AS owner_name,
    ap.name AS approver_name
  FROM public.documents d
  LEFT JOIN public.profiles op ON op.id = d.owner_id
  LEFT JOIN public.profiles ap ON ap.id = d.approver_id
  WHERE d.id = _id
    AND d.visibility = 'public'
    AND d.status = 'approved';
$$;

REVOKE ALL ON FUNCTION public.get_public_document(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_document(uuid) TO anon, authenticated;
