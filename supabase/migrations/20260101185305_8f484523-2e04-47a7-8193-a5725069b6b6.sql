-- Fix use_coupon_code to be idempotent and work with booking that already has coupon_code
CREATE OR REPLACE FUNCTION public.use_coupon_code(_code text, _booking_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _coupon_id UUID;
  _booking_exists BOOLEAN;
  _booking_coupon_code TEXT;
  _coupon_already_used_for_booking BOOLEAN;
BEGIN
  -- First validate the booking exists
  SELECT EXISTS(
    SELECT 1 FROM public.bookings WHERE id = _booking_id
  ) INTO _booking_exists;
  
  IF NOT _booking_exists THEN
    RETURN false;
  END IF;
  
  -- Get booking's current coupon_code
  SELECT coupon_code INTO _booking_coupon_code
  FROM public.bookings WHERE id = _booking_id;
  
  -- If booking has a different coupon code, don't allow changing it
  IF _booking_coupon_code IS NOT NULL AND LOWER(_booking_coupon_code) != LOWER(_code) THEN
    RETURN false;
  END IF;
  
  -- Check if this coupon is already marked as used for this booking (idempotent)
  SELECT EXISTS(
    SELECT 1 FROM public.coupons 
    WHERE LOWER(code) = LOWER(_code) 
    AND used_by_booking_id = _booking_id
  ) INTO _coupon_already_used_for_booking;
  
  IF _coupon_already_used_for_booking THEN
    -- Already marked for this booking, return success (idempotent)
    RETURN true;
  END IF;

  -- Find the coupon and check if it's valid
  SELECT id INTO _coupon_id
  FROM public.coupons
  WHERE LOWER(code) = LOWER(_code)
    AND used_at IS NULL
    AND verified = true;
  
  IF _coupon_id IS NULL THEN
    -- Coupon not found or already used by another booking
    -- But if booking already has this coupon_code, we consider it success
    IF _booking_coupon_code IS NOT NULL AND LOWER(_booking_coupon_code) = LOWER(_code) THEN
      RETURN true;
    END IF;
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
$function$;