-- Fix: Remove overly permissive INSERT policy on coupon_validation_attempts
-- The validate_coupon_code function already uses SECURITY DEFINER, so it can bypass RLS

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow system inserts for rate limiting" ON public.coupon_validation_attempts;

-- Create a restrictive policy that only allows inserts from SECURITY DEFINER functions
-- Since RLS is bypassed by SECURITY DEFINER, we set a policy that denies all direct inserts
CREATE POLICY "No direct inserts allowed" 
ON public.coupon_validation_attempts 
FOR INSERT 
WITH CHECK (false);

-- Similarly fix the booking_creation_attempts table which has the same issue
DROP POLICY IF EXISTS "Allow system inserts for rate limiting" ON public.booking_creation_attempts;

CREATE POLICY "No direct inserts allowed" 
ON public.booking_creation_attempts 
FOR INSERT 
WITH CHECK (false);