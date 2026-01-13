-- Fix public access to bikes
-- Since lock_code was removed from the bikes table (moved to bike_lock_codes), 
-- it is safe to allow public read access to the bikes inventory.
-- This ensures that even if get_public_bikes RPC fails or is unused, the client can read bike status.

ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view bikes" ON public.bikes;

CREATE POLICY "Public can view bikes"
ON public.bikes
FOR SELECT
TO anon, authenticated
USING (true);

-- Re-grant permissions just in case
GRANT SELECT ON public.bikes TO anon;
GRANT SELECT ON public.bikes TO authenticated;

-- Ensure get_public_bikes is definitely accessible
GRANT EXECUTE ON FUNCTION public.get_public_bikes() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_bikes() TO authenticated;

-- Ensure get_public_availability is definitely accessible
GRANT EXECUTE ON FUNCTION public.get_public_availability(date, date, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_availability(date, date, text) TO authenticated;
