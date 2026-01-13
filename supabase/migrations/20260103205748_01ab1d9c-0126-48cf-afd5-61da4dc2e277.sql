-- Add signature and waiver tracking columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS signature_url text,
ADD COLUMN IF NOT EXISTS waiver_version text,
ADD COLUMN IF NOT EXISTS waiver_accepted_at timestamp with time zone;