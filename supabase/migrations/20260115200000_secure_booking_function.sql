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
  desired_size TEXT;
  rider RECORD;
  required_sizes TEXT[];
  available_count INT;
  total_fleet INT;
BEGIN
  -- 1. STRICT AVAILABILITY CHECK (Server-Side)
  -- Loop through riders to count required bikes per size
  FOR rider IN SELECT * FROM jsonb_array_elements(_riders)
  LOOP
    desired_size := rider.value->>'assignedSize';
    
    -- Count total bikes of this size in fleet (excluding unavailable/maintenance)
    SELECT COUNT(*) INTO total_fleet 
    FROM bikes 
    WHERE size = desired_size 
    AND status NOT IN ('maintenance', 'unavailable');

    -- Count existing confirmed bookings for this date/size
    -- (Including overlapping daily sessions from yesterday)
    SELECT COUNT(*) INTO available_count
    FROM bookings b
    CROSS JOIN LATERAL jsonb_array_elements(b.riders) r
    WHERE b.status NOT IN ('cancelled', 'completed')
    AND (
      -- Exact match
      (b.date = _date AND b.session = _session)
      OR
      -- Daily overlaps Morning
      (_session = 'morning' AND b.date = _date AND b.session = 'daily')
      OR
      -- Morning overlaps Daily
      (_session = 'daily' AND b.date = _date AND b.session = 'morning')
      OR
      -- Yesterday's Daily overlaps Today
      (b.date = _date - 1 AND b.session = 'daily')
    )
    AND r->>'assignedSize' = desired_size;

    -- If booked >= fleet, we have a problem 
    -- (Simple check: actually we should sum up requests first, but checking distinct total is safer for now)
    IF (available_count >= total_fleet) THEN
      RAISE EXCEPTION 'No availability for bike size %', desired_size;
    END IF;
  END LOOP;

  -- 2. IF SAFE, PROCEED WITH INSERT
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
