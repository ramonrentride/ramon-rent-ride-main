-- Create storage bucket for CMS images
INSERT INTO storage.buckets (id, name, public)
VALUES ('cms-images', 'cms-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to CMS images
CREATE POLICY "Public read access for CMS images"
ON storage.objects FOR SELECT
USING (bucket_id = 'cms-images');

-- Allow authenticated admin users to upload/update/delete CMS images
CREATE POLICY "Admin upload access for CMS images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cms-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admin update access for CMS images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'cms-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admin delete access for CMS images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cms-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);