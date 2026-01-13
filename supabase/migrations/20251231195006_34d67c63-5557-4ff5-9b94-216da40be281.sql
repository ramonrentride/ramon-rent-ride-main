-- Drop old constraint and add new one with XS
ALTER TABLE public.height_ranges DROP CONSTRAINT height_ranges_size_check;
ALTER TABLE public.height_ranges ADD CONSTRAINT height_ranges_size_check CHECK (size = ANY (ARRAY['XS'::text, 'S'::text, 'M'::text, 'L'::text, 'XL'::text]));

-- Insert XS size
INSERT INTO public.height_ranges (size, min_height, max_height) VALUES ('XS', 146, 157);