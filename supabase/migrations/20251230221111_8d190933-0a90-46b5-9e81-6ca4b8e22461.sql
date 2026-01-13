-- Fix bookings INSERT policy: change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

CREATE POLICY "Anyone can create bookings" 
ON public.bookings 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);