-- Add phone column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text;

-- Drop and recreate the get_staff_users function to include phone
DROP FUNCTION IF EXISTS public.get_staff_users();

CREATE FUNCTION public.get_staff_users()
RETURNS TABLE(user_id uuid, email text, display_name text, phone text, role app_role, created_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ur.user_id,
    au.email,
    COALESCE(p.display_name, au.email) as display_name,
    p.phone,
    ur.role,
    ur.created_at
  FROM public.user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  LEFT JOIN public.profiles p ON p.user_id = ur.user_id
  ORDER BY ur.created_at DESC
$$;