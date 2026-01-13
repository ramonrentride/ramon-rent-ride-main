-- Drop the old restrictive RLS policy
DROP POLICY IF EXISTS "Staff can insert audit logs" ON audit_logs;

-- Create new permissive INSERT policy
CREATE POLICY "Anyone can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Create function to log booking changes automatically
CREATE OR REPLACE FUNCTION public.log_booking_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, details)
    VALUES ('create', 'booking', NEW.id::text, 
      jsonb_build_object('session', NEW.session, 'date', NEW.date, 'total_price', NEW.total_price, 'email', NEW.email));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, details)
    VALUES ('status_change', 'booking', NEW.id::text,
      jsonb_build_object('oldStatus', OLD.status, 'newStatus', NEW.status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for bookings
DROP TRIGGER IF EXISTS booking_audit_trigger ON bookings;
CREATE TRIGGER booking_audit_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION public.log_booking_changes();

-- Create function to log bike changes automatically
CREATE OR REPLACE FUNCTION public.log_bike_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (action, entity_type, entity_id, details)
  VALUES (
    CASE TG_OP 
      WHEN 'INSERT' THEN 'create' 
      WHEN 'UPDATE' THEN 'edit' 
      WHEN 'DELETE' THEN 'delete' 
    END,
    'bike',
    COALESCE(NEW.id, OLD.id)::text,
    CASE TG_OP
      WHEN 'DELETE' THEN jsonb_build_object('size', OLD.size, 'status', OLD.status, 'sticker_number', OLD.sticker_number)
      ELSE jsonb_build_object('size', NEW.size, 'status', NEW.status, 'sticker_number', NEW.sticker_number, 'lock_code', NEW.lock_code)
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for bikes
DROP TRIGGER IF EXISTS bike_audit_trigger ON bikes;
CREATE TRIGGER bike_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bikes
  FOR EACH ROW EXECUTE FUNCTION public.log_bike_changes();

-- Create function to log coupon changes automatically
CREATE OR REPLACE FUNCTION public.log_coupon_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, details)
    VALUES ('create', 'coupon', NEW.code,
      jsonb_build_object('discount', NEW.discount, 'discount_type', NEW.discount_type, 'verified', NEW.verified));
  ELSIF TG_OP = 'UPDATE' AND OLD.used_at IS NULL AND NEW.used_at IS NOT NULL THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, details)
    VALUES ('use', 'coupon', NEW.code,
      jsonb_build_object('used_by_booking_id', NEW.used_by_booking_id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for coupons
DROP TRIGGER IF EXISTS coupon_audit_trigger ON coupons;
CREATE TRIGGER coupon_audit_trigger
  AFTER INSERT OR UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION public.log_coupon_changes();