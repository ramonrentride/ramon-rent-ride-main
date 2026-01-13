-- Create function to get email by display name for login
CREATE OR REPLACE FUNCTION public.get_email_by_display_name(_display_name text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.email
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  WHERE LOWER(p.display_name) = LOWER(_display_name)
  LIMIT 1
$$;