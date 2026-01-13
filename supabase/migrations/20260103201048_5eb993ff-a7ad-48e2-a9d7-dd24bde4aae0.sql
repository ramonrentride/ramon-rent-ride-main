-- Add scheduling fields to site_content for pre-launch mode
-- We'll store schedule_start and schedule_end as separate content entries

-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for signatures bucket
CREATE POLICY "Anyone can upload signatures"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Admins can view all signatures"
ON storage.objects FOR SELECT
USING (bucket_id = 'signatures' AND EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Public can view their own signatures"
ON storage.objects FOR SELECT
USING (bucket_id = 'signatures');

-- Add signature_url and waiver_accepted columns to waiting_list_leads
ALTER TABLE public.waiting_list_leads 
ADD COLUMN IF NOT EXISTS signature_url TEXT,
ADD COLUMN IF NOT EXISTS waiver_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS waiver_version TEXT;