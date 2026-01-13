-- Create table to track coupon validation attempts for rate limiting
CREATE TABLE public.coupon_validation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_identifier TEXT NOT NULL,
  code_attempted TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  was_valid BOOLEAN DEFAULT false
);

-- Enable RLS on the attempts table
ALTER TABLE public.coupon_validation_attempts ENABLE ROW LEVEL SECURITY;

-- No direct access to this table - only through the RPC function
-- The RPC uses SECURITY DEFINER so it can bypass RLS

-- Create index for faster lookups on rate limiting queries
CREATE INDEX idx_coupon_attempts_client_time 
ON public.coupon_validation_attempts(client_identifier, attempted_at DESC);

-- Auto-cleanup old attempts (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_coupon_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.coupon_validation_attempts
  WHERE attempted_at < now() - INTERVAL '24 hours';
END;
$$;

-- Update validate_coupon_code to include rate limiting
CREATE OR REPLACE FUNCTION public.validate_coupon_code(_code TEXT, _client_id TEXT DEFAULT 'anonymous')
RETURNS TABLE(valid BOOLEAN, discount NUMERIC, discount_type TEXT, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _attempt_count INTEGER;
  _rate_limit_window INTERVAL := '15 minutes';
  _max_attempts INTEGER := 5;
BEGIN
  -- Check rate limit: max 5 attempts per 15 minutes per client
  SELECT COUNT(*) INTO _attempt_count
  FROM public.coupon_validation_attempts
  WHERE client_identifier = _client_id
    AND attempted_at > now() - _rate_limit_window;
  
  IF _attempt_count >= _max_attempts THEN
    -- Log the blocked attempt
    INSERT INTO public.coupon_validation_attempts (client_identifier, code_attempted, was_valid)
    VALUES (_client_id, '[RATE_LIMITED]', false);
    
    RETURN QUERY SELECT 
      false as valid,
      0::numeric as discount,
      ''::text as discount_type,
      'rateLimitExceeded'::text as error_message;
    RETURN;
  END IF;
  
  -- Log this attempt
  INSERT INTO public.coupon_validation_attempts (client_identifier, code_attempted, was_valid)
  VALUES (_client_id, _code, false);
  
  -- Perform the actual validation
  RETURN QUERY
  SELECT 
    CASE 
      WHEN c.id IS NULL THEN false
      WHEN c.used_at IS NOT NULL THEN false
      WHEN c.verified = false THEN false
      ELSE true
    END as valid,
    COALESCE(c.discount, 0::numeric) as discount,
    COALESCE(c.discount_type, ''::text) as discount_type,
    CASE 
      WHEN c.id IS NULL THEN 'couponNotFound'
      WHEN c.used_at IS NOT NULL THEN 'couponAlreadyUsed'
      WHEN c.verified = false THEN 'couponNotVerified'
      ELSE NULL
    END as error_message
  FROM (SELECT _code as search_code) as search
  LEFT JOIN public.coupons c ON LOWER(c.code) = LOWER(search.search_code)
  LIMIT 1;
  
  -- Update the attempt record if coupon was valid
  UPDATE public.coupon_validation_attempts
  SET was_valid = true
  WHERE id = (
    SELECT id FROM public.coupon_validation_attempts
    WHERE client_identifier = _client_id AND code_attempted = _code
    ORDER BY attempted_at DESC
    LIMIT 1
  )
  AND EXISTS (
    SELECT 1 FROM public.coupons c
    WHERE LOWER(c.code) = LOWER(_code)
      AND c.used_at IS NULL
      AND c.verified = true
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.validate_coupon_code(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_coupon_attempts() TO authenticated;