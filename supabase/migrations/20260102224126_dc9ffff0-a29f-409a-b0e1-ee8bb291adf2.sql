-- Fix Critical Security Issue 1: Restrict audit_logs INSERT to authenticated staff only
-- Drop the current permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can insert audit logs" ON public.audit_logs;

-- Create a new restrictive INSERT policy for staff only
CREATE POLICY "Staff can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'mechanic'::app_role)
);

-- Fix Critical Security Issue 2: The bookings table already has staff-only SELECT policy
-- But we need to ensure there's no public access. Let's verify and add additional protection.
-- The existing policy "Staff can view all bookings" is correct, but we should also
-- allow the security definer functions to work for public booking lookups.

-- No changes needed for bookings SELECT as it already restricts to staff only.
-- The public booking functions (get_booking_by_id, search_booking_public, etc.) 
-- use SECURITY DEFINER which bypasses RLS appropriately.