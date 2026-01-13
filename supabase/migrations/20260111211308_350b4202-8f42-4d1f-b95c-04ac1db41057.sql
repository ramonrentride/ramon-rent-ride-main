CREATE OR REPLACE FUNCTION public.log_bike_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      ELSE jsonb_build_object('size', NEW.size, 'status', NEW.status, 'sticker_number', NEW.sticker_number)
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;