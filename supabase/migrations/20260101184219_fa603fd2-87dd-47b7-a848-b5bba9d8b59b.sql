-- Update bikes_size_check constraint to include XS
ALTER TABLE public.bikes DROP CONSTRAINT bikes_size_check;
ALTER TABLE public.bikes ADD CONSTRAINT bikes_size_check CHECK (size IN ('XS','S','M','L','XL'));