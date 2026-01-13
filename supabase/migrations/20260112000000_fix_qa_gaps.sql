-- Migration: Fix QA Gaps (Schema & RPCs)

-- 1. Add missing columns to 'bikes' table
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS qr_string TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS active_order_id UUID,
ADD COLUMN IF NOT EXISTS active_phone TEXT;

-- 2. Add Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bikes_qr_string ON public.bikes(qr_string);
CREATE INDEX IF NOT EXISTS idx_bikes_sticker_number ON public.bikes(sticker_number);
CREATE INDEX IF NOT EXISTS idx_bikes_active_order_id ON public.bikes(active_order_id);

-- 3. Create 'bike_locks' table for concurrency control (required by lock_bike_for_booking)
CREATE TABLE IF NOT EXISTS public.bike_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bike_id INTEGER REFERENCES public.bikes(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(bike_id) -- One lock per bike at a time
);

-- Enable RLS on bike_locks
ALTER TABLE public.bike_locks ENABLE ROW LEVEL SECURITY;

-- Allow public access for locking (since anon users create bookings)
CREATE POLICY "Public can manage locks" ON public.bike_locks
FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. RPC: verify_qr_scan
-- Used to verify a user scan against an active order
CREATE OR REPLACE FUNCTION public.verify_qr_scan(_qr_string TEXT, _phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if there is a bike with this QR, associated with the given phone
    RETURN EXISTS (
        SELECT 1 
        FROM public.bikes 
        WHERE qr_string = _qr_string 
        AND active_phone = _phone
        AND active_order_id IS NOT NULL
        AND status = 'rented'
    );
END;
$$;

-- Grant execution to public
GRANT EXECUTE ON FUNCTION public.verify_qr_scan TO anon, authenticated;

-- 5. RPC: get_order_lock_codes
-- Returns all lock codes for the active order associated with the QR scan
CREATE OR REPLACE FUNCTION public.get_order_lock_codes(_order_id UUID, _phone TEXT)
RETURNS TABLE (
    bike_id INTEGER,
    sticker_number TEXT,
    size TEXT,
    lock_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Return bikes matching the order AND the verified phone for security
    RETURN QUERY
    SELECT 
        b.id,
        b.sticker_number,
        b.size,
        b.lock_code
    FROM public.bikes b
    WHERE b.active_order_id = _order_id
    AND b.active_phone = _phone;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_lock_codes TO anon, authenticated;

-- 6. RPC: release_bike_from_order
-- Releases a bike from an active order (Admin/System function)
CREATE OR REPLACE FUNCTION public.release_bike_from_order(_bike_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.bikes
    SET 
        status = 'available',
        active_order_id = NULL,
        active_phone = NULL
    WHERE id = _bike_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.release_bike_from_order TO anon, authenticated;

-- 7. RPC: check_bike_availability (DB Version)
-- Checks if specific bikes are available for a date/session
CREATE OR REPLACE FUNCTION public.check_bike_availability(_bike_ids INTEGER[], _date DATE, _session TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    unavailable_count INTEGER;
BEGIN
    -- Determine if any of the requested bikes are booked for the given date/session
    SELECT COUNT(*)
    INTO unavailable_count
    FROM public.bookings b, jsonb_array_elements(b.riders) r
    WHERE 
        b.date = _date 
        AND b.session = _session
        AND b.status IN ('confirmed', 'checked-in', 'active')
        AND (r->>'assignedBike')::INTEGER = ANY(_bike_ids);
        
    RETURN unavailable_count = 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_bike_availability TO anon, authenticated;

-- 8. RPC: lock_bike_for_booking
-- Locks a bike temporarily while booking is in progress
CREATE OR REPLACE FUNCTION public.lock_bike_for_booking(_bike_id INTEGER, _session_id TEXT, _lock_duration_minutes INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Cleanup expired locks first
    DELETE FROM public.bike_locks WHERE expires_at < now();

    -- Check if bike is already locked by another session
    IF EXISTS (
        SELECT 1 FROM public.bike_locks 
        WHERE bike_id = _bike_id 
        AND session_id != _session_id
    ) THEN
        RETURN FALSE;
    END IF;

    -- Upsert lock
    INSERT INTO public.bike_locks (bike_id, session_id, expires_at)
    VALUES (
        _bike_id, 
        _session_id, 
        now() + (_lock_duration_minutes || ' minutes')::INTERVAL
    )
    ON CONFLICT (bike_id) 
    DO UPDATE SET 
        expires_at = now() + (_lock_duration_minutes || ' minutes')::INTERVAL,
        session_id = _session_id; -- Update session if same (refresh) or expired (replaced by logic above)
        
    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lock_bike_for_booking TO anon, authenticated;

-- 9. RPC: release_bike_lock
CREATE OR REPLACE FUNCTION public.release_bike_lock(_bike_id INTEGER, _session_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.bike_locks 
    WHERE bike_id = _bike_id AND session_id = _session_id;
    
    RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.release_bike_lock TO anon, authenticated;

-- 10. Helper: Update bikes on booking creation (to set active_order_id)
-- This triggers after booking insert to update the bikes table
CREATE OR REPLACE FUNCTION public.sync_bikes_with_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    rider jsonb;
    assigned_bike_id INTEGER;
BEGIN
    IF NEW.status IN ('confirmed', 'checked-in', 'active') THEN
        FOR rider IN SELECT * FROM jsonb_array_elements(NEW.riders)
        LOOP
            assigned_bike_id := (rider->>'assignedBike')::INTEGER;
            
            IF assigned_bike_id IS NOT NULL THEN
                UPDATE public.bikes
                SET 
                    status = 'rented',
                    active_order_id = NEW.id,
                    active_phone = NEW.phone
                WHERE id = assigned_bike_id;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;

-- Create Trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_sync_bikes_booking ON public.bookings;
CREATE TRIGGER trigger_sync_bikes_booking
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.sync_bikes_with_booking();
