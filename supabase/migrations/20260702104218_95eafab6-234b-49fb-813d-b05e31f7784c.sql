GRANT SELECT, INSERT, UPDATE, DELETE ON public.shooting_requests TO authenticated;
GRANT ALL ON public.shooting_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shooting_request_history TO authenticated;
GRANT ALL ON public.shooting_request_history TO service_role;