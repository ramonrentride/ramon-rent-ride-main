-- Recreate get_public_bikes with SECURITY DEFINER to bypass RLS
-- This allows anonymous users to see bike availability without exposing lock_code
CREATE OR REPLACE FUNCTION public.get_public_bikes()
RETURNS TABLE (
  id integer,
  size text,
  status text,
  sticker_number text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    b.id,
    b.size,
    b.status,
    b.sticker_number,
    b.created_at,
    b.updated_at
  FROM public.bikes b
  ORDER BY b.id;
$$;

-- Grant execute permissions to both anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_bikes() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_bikes() TO authenticated;