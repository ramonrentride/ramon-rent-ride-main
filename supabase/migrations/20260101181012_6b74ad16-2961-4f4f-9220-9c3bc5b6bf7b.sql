-- Create function to get booking by ID for public access (confirmation page)
CREATE OR REPLACE FUNCTION public.get_booking_by_id(booking_uuid UUID)
RETURNS TABLE (
  id UUID,
  date DATE,
  session TEXT,
  riders JSONB,
  picnic JSONB,
  status TEXT,
  total_price NUMERIC,
  security_hold NUMERIC,
  phone TEXT,
  email TEXT,
  legal_accepted BOOLEAN,
  payment_method TEXT,
  coupon_code TEXT,
  safety_briefing_completed BOOLEAN,
  bike_condition_confirmed BOOLEAN,
  return_photos TEXT[],
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id, b.date, b.session, b.riders, b.picnic, b.status,
    b.total_price, b.security_hold, b.phone, b.email,
    b.legal_accepted, b.payment_method, b.coupon_code,
    b.safety_briefing_completed, b.bike_condition_confirmed,
    b.return_photos, b.created_at
  FROM bookings b
  WHERE b.id = booking_uuid;
END;
$$;

-- Grant execute to anon so guests can view their booking confirmation
GRANT EXECUTE ON FUNCTION public.get_booking_by_id TO anon;