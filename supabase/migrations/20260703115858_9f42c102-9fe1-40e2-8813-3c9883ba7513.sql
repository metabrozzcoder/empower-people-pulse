
CREATE TABLE public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text,
  type text NOT NULL DEFAULT 'Full-time',
  status text NOT NULL DEFAULT 'Active',
  salary text,
  requirements text[] NOT NULL DEFAULT '{}',
  description text,
  posted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_postings TO authenticated;
GRANT ALL ON public.job_postings TO service_role;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view job postings"
  ON public.job_postings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/HR can insert job postings"
  ON public.job_postings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "Admin/HR can update job postings"
  ON public.job_postings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "Admin/HR can delete job postings"
  ON public.job_postings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));

CREATE TRIGGER trg_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  position text,
  ai_score int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Applied',
  skills text[] NOT NULL DEFAULT '{}',
  experience text,
  notes text,
  resume_url text,
  source text,
  job_posting_id uuid REFERENCES public.job_postings(id) ON DELETE SET NULL,
  applied_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated;
GRANT ALL ON public.candidates TO service_role;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view candidates"
  ON public.candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/HR can insert candidates"
  ON public.candidates FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "Admin/HR can update candidates"
  ON public.candidates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "Admin/HR can delete candidates"
  ON public.candidates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));

CREATE TRIGGER trg_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
