-- Update the get_public_availability to query public.bookings (which is the correct table)
-- but ensure we assume the user might have thought it didn't exist due to RLS.
-- This migration reaffirms the table usage and permission.

CREATE OR REPLACE FUNCTION public.get_public_availability(
  _start_date date,
  _end_date date,
  _session text DEFAULT NULL
)
RETURNS TABLE (
  booking_date date,
  session_type text,
  booked_count int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.date::date as booking_date,
    b.session as session_type,
    SUM(jsonb_array_length(b.riders))::int as booked_count
  FROM public.bookings b
  WHERE b.date >= _start_date 
    AND b.date <= _end_date
    AND b.status NOT IN ('cancelled')
    AND (_session IS NULL OR b.session = _session)
  GROUP BY b.date, b.session
  ORDER BY b.date, b.session;
END;
$$;

-- Grant execute permission to anon users explicitly again
GRANT EXECUTE ON FUNCTION public.get_public_availability(date, date, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_availability(date, date, text) TO authenticated;
