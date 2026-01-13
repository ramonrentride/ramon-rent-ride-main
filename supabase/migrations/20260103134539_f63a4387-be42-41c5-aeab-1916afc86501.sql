-- Fix Critical Issue 1: Separate bike lock codes into restricted table
-- Create a new table for lock codes with admin-only access
CREATE TABLE public.bike_lock_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id integer NOT NULL UNIQUE REFERENCES public.bikes(id) ON DELETE CASCADE,
  lock_code text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bike_lock_codes ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies (mechanics cannot see lock codes)
CREATE POLICY "Only admins can view lock codes" 
ON public.bike_lock_codes 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert lock codes" 
ON public.bike_lock_codes 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update lock codes" 
ON public.bike_lock_codes 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete lock codes" 
ON public.bike_lock_codes 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing lock codes to the new table
INSERT INTO public.bike_lock_codes (bike_id, lock_code)
SELECT id, lock_code FROM public.bikes;

-- Remove lock_code column from bikes table
ALTER TABLE public.bikes DROP COLUMN lock_code;

-- Fix Critical Issue 2: Restrict bookings to admin-only (mechanics shouldn't see customer PII)
-- Drop the existing staff policy that allows mechanics to see all bookings
DROP POLICY IF EXISTS "Staff can view all bookings" ON public.bookings;

-- Create admin-only SELECT policy for full booking data
CREATE POLICY "Admins can view all bookings" 
ON public.bookings 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a security definer function for mechanics to see only their needed booking info
CREATE OR REPLACE FUNCTION public.get_mechanic_bookings(_date date)
RETURNS TABLE(
  id uuid,
  date date,
  session text,
  status text,
  riders jsonb,
  bike_condition_confirmed boolean,
  safety_briefing_completed boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    b.id,
    b.date,
    b.session,
    b.status,
    b.riders,
    b.bike_condition_confirmed,
    b.safety_briefing_completed
  FROM public.bookings b
  WHERE b.date = _date
  ORDER BY b.session, b.created_at;
$$;

-- Update timestamp trigger for bike_lock_codes
CREATE TRIGGER update_bike_lock_codes_updated_at
BEFORE UPDATE ON public.bike_lock_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();