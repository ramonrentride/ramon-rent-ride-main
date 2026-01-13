-- Create function to get all bookings by phone or email
CREATE OR REPLACE FUNCTION public.get_bookings_by_contact(_phone_or_email TEXT)
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
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
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
    LOWER(b.phone) = LOWER(_phone_or_email) 
    OR LOWER(b.email) = LOWER(_phone_or_email)
  ORDER BY b.date DESC, b.created_at DESC;
END;
$$;