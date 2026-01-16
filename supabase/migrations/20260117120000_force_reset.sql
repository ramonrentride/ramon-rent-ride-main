-- 1. DROP EVERYTHING (Force clean slate)
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.bikes CASCADE;

-- 2. REBUILD BIKES (Correct UUID type)
CREATE TABLE public.bikes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    size TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    model TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. REBUILD BOOKINGS (Correct UUID type linked to bikes)
CREATE TABLE public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bike_id UUID REFERENCES public.bikes(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    customer_email TEXT,
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. SECURITY & ACCESS
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.bikes FOR SELECT USING (true);
CREATE POLICY "Public read bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Public insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);

-- 5. RESTORE INVENTORY (15 Units)
INSERT INTO public.bikes (size, status) VALUES
  ('S', 'active'), ('S', 'active'), ('S', 'active'), ('S', 'active'),
  ('M', 'active'), ('M', 'active'), ('M', 'active'), ('M', 'active'), ('M', 'active'),
  ('L', 'active'), ('L', 'active'), ('L', 'active'), ('L', 'active'),
  ('XL', 'active'), ('XL', 'active');
