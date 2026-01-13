-- Add admin-only policy for the coupon_validation_attempts table
-- This satisfies the linter while keeping the table secure (only accessible via RPC)
CREATE POLICY "Admins can view coupon attempts"
ON public.coupon_validation_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));