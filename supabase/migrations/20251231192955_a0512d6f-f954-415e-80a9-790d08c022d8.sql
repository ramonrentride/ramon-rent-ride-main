-- Create function to log pricing changes automatically
CREATE OR REPLACE FUNCTION public.log_pricing_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (action, entity_type, entity_id, details)
  VALUES ('update', 'pricing', NEW.key,
    jsonb_build_object('key', NEW.key, 'old_value', OLD.value, 'new_value', NEW.value));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for pricing
DROP TRIGGER IF EXISTS pricing_audit_trigger ON pricing;
CREATE TRIGGER pricing_audit_trigger
  AFTER UPDATE ON pricing
  FOR EACH ROW 
  WHEN (OLD.value IS DISTINCT FROM NEW.value)
  EXECUTE FUNCTION public.log_pricing_changes();

-- Create function to log height ranges changes automatically
CREATE OR REPLACE FUNCTION public.log_height_ranges_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (action, entity_type, entity_id, details)
  VALUES (
    CASE TG_OP 
      WHEN 'INSERT' THEN 'create' 
      WHEN 'UPDATE' THEN 'update' 
      WHEN 'DELETE' THEN 'delete' 
    END,
    'height_ranges',
    COALESCE(NEW.size, OLD.size),
    CASE TG_OP
      WHEN 'DELETE' THEN jsonb_build_object('size', OLD.size, 'min_height', OLD.min_height, 'max_height', OLD.max_height)
      WHEN 'INSERT' THEN jsonb_build_object('size', NEW.size, 'min_height', NEW.min_height, 'max_height', NEW.max_height)
      ELSE jsonb_build_object(
        'size', NEW.size, 
        'old_min', OLD.min_height, 'new_min', NEW.min_height,
        'old_max', OLD.max_height, 'new_max', NEW.max_height
      )
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for height_ranges
DROP TRIGGER IF EXISTS height_ranges_audit_trigger ON height_ranges;
CREATE TRIGGER height_ranges_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON height_ranges
  FOR EACH ROW EXECUTE FUNCTION public.log_height_ranges_changes();