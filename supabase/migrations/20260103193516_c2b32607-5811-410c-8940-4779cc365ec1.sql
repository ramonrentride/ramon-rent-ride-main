-- Create waiting list leads table
CREATE TABLE public.waiting_list_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waiting_list_leads ENABLE ROW LEVEL SECURITY;

-- Public can insert (join waiting list)
CREATE POLICY "Anyone can join waiting list"
ON public.waiting_list_leads
FOR INSERT
WITH CHECK (true);

-- Only admins can view leads
CREATE POLICY "Admins can view waiting list"
ON public.waiting_list_leads
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete leads
CREATE POLICY "Admins can delete waiting list leads"
ON public.waiting_list_leads
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add pre-launch mode setting to site_content
INSERT INTO public.site_content (section, content_key, value_he, value_en, content_type, is_active, metadata)
VALUES ('system', 'pre_launch_mode', 'true', 'true', 'setting', true, '{"type": "boolean"}'::jsonb)
ON CONFLICT DO NOTHING;