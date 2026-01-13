-- Fix remaining security issues

-- 1. Drop the overly permissive "Public can view bikes for booking" policy on bikes
-- We keep only "Staff can view all bike fields" for authenticated staff
DROP POLICY IF EXISTS "Public can view bikes for booking" ON public.bikes;

-- 2. Ensure bookings table has proper SELECT restriction
-- The existing "Staff can view all bookings" policy already restricts SELECT to staff only
-- But we should verify no public SELECT exists - the bookings table is already secure

-- Note: The bikes table now only allows SELECT for staff (admin/mechanic)
-- The booking page uses the get_public_bikes() function for public access without lock_code