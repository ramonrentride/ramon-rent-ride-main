-- Create mechanic_issues table for storing open issues
CREATE TABLE public.mechanic_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id INTEGER NOT NULL REFERENCES public.bikes(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('tire', 'chain', 'brake', 'other')),
  description TEXT,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mechanic_issues ENABLE ROW LEVEL SECURITY;

-- Staff can view all issues
CREATE POLICY "Staff can view issues" ON public.mechanic_issues
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'mechanic'::app_role)
  );

-- Staff can insert issues
CREATE POLICY "Staff can insert issues" ON public.mechanic_issues
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'mechanic'::app_role)
  );

-- Staff can update issues
CREATE POLICY "Staff can update issues" ON public.mechanic_issues
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'mechanic'::app_role)
  );

-- Admins can delete issues
CREATE POLICY "Admins can delete issues" ON public.mechanic_issues
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Add index for faster queries
CREATE INDEX idx_mechanic_issues_bike_id ON public.mechanic_issues(bike_id);
CREATE INDEX idx_mechanic_issues_resolved ON public.mechanic_issues(resolved);