-- Fix RLS policies on audit_logs table

-- Drop the RESTRICTIVE SELECT policy
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

-- Create a PERMISSIVE SELECT policy for admins
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix INSERT policy to allow logging from all contexts (including public bookings)
DROP POLICY IF EXISTS "Authenticated users can insert their own audit logs" ON public.audit_logs;

CREATE POLICY "Anyone can insert audit logs"
ON public.audit_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);