-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'mechanic');

-- Create user_roles table (separate from profiles to prevent privilege escalation)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create profiles table for user display info
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS policies for user_roles (only admins can manage roles)
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create bikes table
CREATE TABLE public.bikes (
    id SERIAL PRIMARY KEY,
    size TEXT NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL')),
    lock_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'rented', 'unavailable')),
    sticker_number TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bikes
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;

-- Bikes RLS policies
CREATE POLICY "Authenticated users can view bikes"
ON public.bikes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin and mechanic can update bikes"
ON public.bikes
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'mechanic'));

CREATE POLICY "Admins can insert bikes"
ON public.bikes
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bikes"
ON public.bikes
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    session TEXT NOT NULL CHECK (session IN ('morning', 'daily')),
    riders JSONB NOT NULL DEFAULT '[]',
    picnic JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked-in', 'in-ride', 'returning', 'completed', 'cancelled')),
    total_price DECIMAL(10,2) NOT NULL,
    security_hold DECIMAL(10,2),
    safety_briefing_completed BOOLEAN DEFAULT false,
    bike_condition_confirmed BOOLEAN DEFAULT false,
    return_photos TEXT[] DEFAULT '{}',
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    legal_accepted BOOLEAN DEFAULT false,
    payment_method TEXT,
    coupon_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Bookings RLS policies (public can create, only staff can view/manage)
CREATE POLICY "Anyone can create bookings"
ON public.bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Staff can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'mechanic'));

CREATE POLICY "Staff can update bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'mechanic'));

-- Create coupons table
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount DECIMAL(10,2) NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    booking_id UUID REFERENCES public.bookings(id),
    is_manual BOOLEAN DEFAULT false,
    verification_email TEXT,
    verified BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by_booking_id UUID REFERENCES public.bookings(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Coupons RLS policies
CREATE POLICY "Staff can view all coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can insert coupons"
ON public.coupons
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can update coupons"
ON public.coupons
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create maintenance_logs table
CREATE TABLE public.maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bike_id INTEGER REFERENCES public.bikes(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on maintenance_logs
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Maintenance logs RLS policies
CREATE POLICY "Staff can view maintenance logs"
ON public.maintenance_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'mechanic'));

CREATE POLICY "Staff can insert maintenance logs"
ON public.maintenance_logs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'mechanic'));

CREATE POLICY "Staff can update maintenance logs"
ON public.maintenance_logs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'mechanic'));

CREATE POLICY "Staff can delete maintenance logs"
ON public.maintenance_logs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'mechanic'));

-- Create parts_inventory table
CREATE TABLE public.parts_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 0,
    needs_order BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on parts_inventory
ALTER TABLE public.parts_inventory ENABLE ROW LEVEL SECURITY;

-- Parts inventory RLS policies
CREATE POLICY "Staff can view parts inventory"
ON public.parts_inventory
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'mechanic'));

CREATE POLICY "Staff can update parts inventory"
ON public.parts_inventory
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'mechanic'));

CREATE POLICY "Admins can insert parts"
ON public.parts_inventory
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create height_ranges table
CREATE TABLE public.height_ranges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    size TEXT NOT NULL UNIQUE CHECK (size IN ('S', 'M', 'L', 'XL')),
    min_height INTEGER NOT NULL,
    max_height INTEGER NOT NULL
);

-- Enable RLS on height_ranges
ALTER TABLE public.height_ranges ENABLE ROW LEVEL SECURITY;

-- Height ranges RLS policies (public read, admin write)
CREATE POLICY "Anyone can view height ranges"
ON public.height_ranges
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can update height ranges"
ON public.height_ranges
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create pricing table
CREATE TABLE public.pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value DECIMAL(10,2) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on pricing
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;

-- Pricing RLS policies (public read, admin write)
CREATE POLICY "Anyone can view pricing"
ON public.pricing
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can update pricing"
ON public.pricing
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bikes_updated_at
    BEFORE UPDATE ON public.bikes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parts_inventory_updated_at
    BEFORE UPDATE ON public.parts_inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial height ranges
INSERT INTO public.height_ranges (size, min_height, max_height) VALUES
    ('S', 140, 155),
    ('M', 156, 170),
    ('L', 171, 185),
    ('XL', 186, 210);

-- Insert initial pricing
INSERT INTO public.pricing (key, value) VALUES
    ('morningSession', 80),
    ('dailySession', 120),
    ('picnic', 160),
    ('lateFee', 120),
    ('theftFee', 2500),
    ('securityHold', 500);

-- Insert initial parts inventory
INSERT INTO public.parts_inventory (name, quantity, min_quantity, needs_order) VALUES
    ('צמיג 26"', 10, 5, false),
    ('צמיג 29"', 8, 4, false),
    ('שרשרת', 6, 3, false),
    ('רפידות בלם', 12, 6, false),
    ('פנימית 26"', 15, 8, false),
    ('פנימית 29"', 12, 6, false);

-- Insert initial bikes (20 bikes)
INSERT INTO public.bikes (size, lock_code, status, sticker_number)
SELECT 
    CASE 
        WHEN i <= 5 THEN 'S'
        WHEN i <= 10 THEN 'M'
        WHEN i <= 15 THEN 'L'
        ELSE 'XL'
    END,
    LPAD((1000 + floor(random() * 9000))::text, 4, '0'),
    'available',
    'R' || LPAD(i::text, 2, '0')
FROM generate_series(1, 20) AS i;