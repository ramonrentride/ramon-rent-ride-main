-- Create a SECURITY DEFINER function to create bookings for anonymous users
CREATE OR REPLACE FUNCTION public.create_booking_public(
  _date DATE,
  _session TEXT,
  _riders JSONB,
  _picnic JSONB,
  _status TEXT,
  _total_price NUMERIC,
  _security_hold NUMERIC,
  _phone TEXT,
  _email TEXT,
  _legal_accepted BOOLEAN,
  _payment_method TEXT,
  _coupon_code TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO bookings (
    date, session, riders, picnic, status, total_price, 
    security_hold, phone, email, legal_accepted, 
    payment_method, coupon_code
  ) VALUES (
    _date, _session, _riders, _picnic, _status, _total_price,
    _security_hold, _phone, _email, _legal_accepted,
    _payment_method, _coupon_code
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.create_booking_public TO anon;