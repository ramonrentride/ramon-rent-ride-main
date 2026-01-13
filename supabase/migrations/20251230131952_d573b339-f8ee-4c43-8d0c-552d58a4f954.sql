-- Create a secure RPC function for public coupon validation
CREATE OR REPLACE FUNCTION public.validate_coupon_code(_code TEXT)
RETURNS TABLE(valid BOOLEAN, discount NUMERIC, discount_type TEXT, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
END;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.validate_coupon_code(TEXT) TO anon, authenticated;

-- Create a secure RPC function to mark coupon as used (called after booking is created)
CREATE OR REPLACE FUNCTION public.use_coupon_code(_code TEXT, _booking_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _coupon_id UUID;
BEGIN
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

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.use_coupon_code(TEXT, UUID) TO anon, authenticated;