-- Function to search for a booking publicly with phone/email verification
CREATE OR REPLACE FUNCTION public.search_booking_public(
  _search_query TEXT,
  _phone_or_email TEXT
)
RETURNS TABLE(
  id UUID,
  date DATE,
  session TEXT,
  status TEXT,
  total_price NUMERIC,
  phone TEXT,
  email TEXT,
  riders JSONB,
  picnic JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Search by booking ID, rider name, or phone - but only return if phone/email matches
  RETURN QUERY
  SELECT 
    b.id,
    b.date,
    b.session,
    b.status,
    b.total_price,
    b.phone,
    b.email,
    b.riders,
    b.picnic,
    b.created_at
  FROM public.bookings b
  WHERE 
    -- Must match phone or email for security
    (LOWER(b.phone) = LOWER(_phone_or_email) OR LOWER(b.email) = LOWER(_phone_or_email))
    AND (
      -- Search by booking ID
      b.id::TEXT ILIKE '%' || _search_query || '%'
      -- Or search by phone
      OR b.phone ILIKE '%' || _search_query || '%'
      -- Or search by rider name in JSONB array
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(b.riders) AS rider
        WHERE rider->>'name' ILIKE '%' || _search_query || '%'
      )
    )
  ORDER BY b.created_at DESC
  LIMIT 1;
END;
$$;

-- Function to cancel a booking publicly with phone verification
CREATE OR REPLACE FUNCTION public.cancel_booking_public(
  _booking_id UUID,
  _phone TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _booking_exists BOOLEAN;
BEGIN
  -- Check if booking exists and phone matches
  SELECT EXISTS(
    SELECT 1 FROM public.bookings 
    WHERE id = _booking_id 
    AND LOWER(phone) = LOWER(_phone)
    AND status NOT IN ('cancelled', 'completed')
  ) INTO _booking_exists;
  
  IF NOT _booking_exists THEN
    RETURN false;
  END IF;
  
  -- Update booking status to cancelled
  UPDATE public.bookings
  SET status = 'cancelled', updated_at = now()
  WHERE id = _booking_id AND LOWER(phone) = LOWER(_phone);
  
  RETURN true;
END;
$$;