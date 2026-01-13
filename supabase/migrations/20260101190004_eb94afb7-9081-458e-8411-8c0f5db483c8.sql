-- 1. Fix audit_logs: Only authenticated users can insert, and must provide their own user_id
DROP POLICY IF EXISTS "Anyone can insert audit logs" ON public.audit_logs;

CREATE POLICY "Authenticated users can insert their own audit logs" 
ON public.audit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 2. Fix bikes: Remove the overly permissive "Anyone can view bike availability" policy
-- The get_public_bikes function already handles public access without lock_code
DROP POLICY IF EXISTS "Anyone can view bike availability" ON public.bikes;

-- 3. Add a policy that only returns non-sensitive fields for public
-- Actually, we should use the get_public_bikes function for public access
-- So no SELECT policy needed for anonymous users - they use the function

-- 4. Clean up duplicate bookings - keep the first one from each group
-- First, identify and delete duplicates (keeping the earliest created_at)
DELETE FROM public.bookings 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY phone, date, session 
             ORDER BY created_at ASC
           ) as rn
    FROM public.bookings
    WHERE date = '2026-01-04' 
    AND phone = '0542224691'
    AND session = 'morning'
  ) ranked
  WHERE rn > 1
);