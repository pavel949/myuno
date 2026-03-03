
-- Table for project/complex requests from users to myUNO team
CREATE TABLE public.project_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by UUID NOT NULL,
  project_name TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_project_id UUID REFERENCES public.property_projects(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own requests
CREATE POLICY "Users can view own requests"
  ON public.project_requests FOR SELECT
  USING (auth.uid() = requested_by);

-- Users can create requests
CREATE POLICY "Users can create requests"
  ON public.project_requests FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

-- Admins can view all
CREATE POLICY "Admins can view all requests"
  ON public.project_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update
CREATE POLICY "Admins can update requests"
  ON public.project_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
