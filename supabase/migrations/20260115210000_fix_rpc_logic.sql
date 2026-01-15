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
    COALESCE(bike.size, r->>'assignedSize') as bike_size, -- Fallback to JSON size if JOIN fails (rare)
    COUNT(*)::int as booked_count
  FROM public.bookings b
  CROSS JOIN LATERAL jsonb_array_elements(b.riders) r
  -- LEFT JOIN allows us to count even if bike deleted, using fallback size
  LEFT JOIN public.bikes bike ON bike.id = (r->>'assignedBike')::int
  WHERE b.date >= _start_date 
    AND b.date <= _end_date
    AND b.status NOT IN ('cancelled')
    -- Ensure we have a valid count
    AND (bike.size IS NOT NULL OR r->>'assignedSize' IS NOT NULL)
  GROUP BY b.date, b.session, COALESCE(bike.size, r->>'assignedSize');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_availability_by_size(date, date) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_availability_by_size(date, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_public_availability_by_size(date, date) TO authenticated;
