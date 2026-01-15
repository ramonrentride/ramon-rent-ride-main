CREATE OR REPLACE FUNCTION public.get_public_availability_by_size(
  _start_date date,
  _end_date date
)
RETURNS TABLE (
  booking_date date,
  session_type text,
  bike_size text,
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
    r->>'assignedSize' as bike_size,
    COUNT(*)::int as booked_count
  FROM public.bookings b
  CROSS JOIN LATERAL jsonb_array_elements(b.riders) r
  WHERE b.date >= _start_date 
    AND b.date <= _end_date
    AND b.status NOT IN ('cancelled')
  GROUP BY b.date, b.session, r->>'assignedSize';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_availability_by_size(date, date) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_availability_by_size(date, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_public_availability_by_size(date, date) TO authenticated;
