-- Create audit_logs table for tracking all staff actions
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_display_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Staff can insert audit logs
CREATE POLICY "Staff can insert audit logs"
  ON public.audit_logs
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'mechanic'::app_role));

-- Create index for efficient querying by date
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- Create storage bucket for return photos (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('return-photos', 'return-photos', false);

-- Storage policies for return photos - only staff can upload and view
CREATE POLICY "Staff can upload return photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'return-photos' 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'mechanic'::app_role))
  );

CREATE POLICY "Staff can view return photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'return-photos' 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'mechanic'::app_role))
  );

CREATE POLICY "Staff can delete return photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'return-photos' 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'mechanic'::app_role))
  );