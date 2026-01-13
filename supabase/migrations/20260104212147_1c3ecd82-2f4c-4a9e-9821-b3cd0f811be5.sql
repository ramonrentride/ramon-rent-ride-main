-- Create rental-docs bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('rental-docs', 'rental-docs', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for rental-docs bucket
CREATE POLICY "Anyone can view rental docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'rental-docs');

CREATE POLICY "Authenticated can upload rental docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'rental-docs');

CREATE POLICY "Authenticated can update rental docs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'rental-docs');

CREATE POLICY "Authenticated can delete rental docs"
ON storage.objects FOR DELETE
USING (bucket_id = 'rental-docs');

-- Make signatures bucket public (fix for admin display)
UPDATE storage.buckets SET public = true WHERE name = 'signatures';

-- Add documents_urls column to bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS documents_urls TEXT[] DEFAULT '{}';

-- Add documents_urls column to waiting_list_leads
ALTER TABLE public.waiting_list_leads 
ADD COLUMN IF NOT EXISTS documents_urls TEXT[] DEFAULT '{}';