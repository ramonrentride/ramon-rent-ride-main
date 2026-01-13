-- Create function to check if any admins exist
CREATE OR REPLACE FUNCTION public.has_any_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'
  )
$$;

-- Create function to get all staff users (for admin panel)
CREATE OR REPLACE FUNCTION public.get_staff_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  role app_role,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ur.user_id,
    au.email,
    COALESCE(p.display_name, au.email) as display_name,
    ur.role,
    ur.created_at
  FROM public.user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  LEFT JOIN public.profiles p ON p.user_id = ur.user_id
  ORDER BY ur.created_at DESC
$$;