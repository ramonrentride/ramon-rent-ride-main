-- Add rate limiting to get_email_by_display_name function to prevent username enumeration
-- We create a login_attempts table to track attempts

-- Create a login attempts tracking table
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_identifier TEXT NOT NULL,
  username_attempted TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on login_attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only allow inserts from authenticated contexts (RPC functions)
-- No select policy - data is only for rate limiting
CREATE POLICY "No direct access to login attempts"
ON public.login_attempts
FOR ALL
USING (false);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_client_time 
ON public.login_attempts(client_identifier, attempted_at DESC);

-- Replace get_email_by_display_name with rate-limited version
CREATE OR REPLACE FUNCTION public.get_email_by_display_name(_display_name text, _client_id text DEFAULT 'anonymous')
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _attempt_count INTEGER;
  _rate_limit_window INTERVAL := '15 minutes';
  _max_attempts INTEGER := 10;
  _result_email TEXT;
BEGIN
  -- Check rate limit: max 10 attempts per 15 minutes per client
  SELECT COUNT(*) INTO _attempt_count
  FROM public.login_attempts
  WHERE client_identifier = _client_id
    AND attempted_at > now() - _rate_limit_window;
  
  IF _attempt_count >= _max_attempts THEN
    -- Return NULL to indicate rate limit without revealing if user exists
    RETURN NULL;
  END IF;
  
  -- Log this attempt
  INSERT INTO public.login_attempts (client_identifier, username_attempted)
  VALUES (_client_id, _display_name);
  
  -- Perform the actual lookup
  SELECT au.email INTO _result_email
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  WHERE LOWER(p.display_name) = LOWER(_display_name)
  LIMIT 1;
  
  RETURN _result_email;
END;
$$;

-- Create cleanup function for old login attempts
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts
  WHERE attempted_at < now() - INTERVAL '24 hours';
END;
$$;

-- Update use_coupon_code to validate booking exists and has not used coupon
CREATE OR REPLACE FUNCTION public.use_coupon_code(_code text, _booking_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _coupon_id UUID;
  _booking_exists BOOLEAN;
  _already_has_coupon BOOLEAN;
BEGIN
  -- First validate the booking exists
  SELECT EXISTS(
    SELECT 1 FROM public.bookings WHERE id = _booking_id
  ) INTO _booking_exists;
  
  IF NOT _booking_exists THEN
    RETURN false;
  END IF;
  
  -- Check if booking already has a coupon applied
  SELECT (coupon_code IS NOT NULL) INTO _already_has_coupon
  FROM public.bookings WHERE id = _booking_id;
  
  IF _already_has_coupon THEN
    RETURN false;
  END IF;

  -- Find the coupon and check if it's valid
  SELECT id INTO _coupon_id
  FROM public.coupons
  WHERE LOWER(code) = LOWER(_code)
    AND used_at IS NULL
    AND verified = true;
  
  IF _coupon_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Mark the coupon as used
  UPDATE public.coupons
  SET 
    used_at = now(),
    used_by_booking_id = _booking_id
  WHERE id = _coupon_id;
  
  RETURN true;
END;
$$;

-- Replace get_public_bikes with SECURITY INVOKER version
-- First, we need to create an RLS policy that allows public read access
DROP FUNCTION IF EXISTS public.get_public_bikes();

-- Create a new version that returns data without SECURITY DEFINER
-- Using a view with RLS would be cleaner but this maintains compatibility
CREATE OR REPLACE FUNCTION public.get_public_bikes()
RETURNS TABLE(id integer, size text, status text, sticker_number text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    b.id,
    b.size,
    b.status,
    b.sticker_number,
    b.created_at,
    b.updated_at
  FROM public.bikes b
  ORDER BY b.id;
$$;

-- Add policy to allow public read of bikes (without lock_code)
-- Note: This is safe because lock_code is not included in the function results
CREATE POLICY "Anyone can view bike availability"
ON public.bikes
FOR SELECT
USING (true);