-- Drop the old version and recreate with VOLATILE marker
DROP FUNCTION IF EXISTS public.get_email_by_display_name(text);
DROP FUNCTION IF EXISTS public.get_email_by_display_name(text, text);

CREATE FUNCTION public.get_email_by_display_name(_display_name text, _client_id text DEFAULT 'anonymous'::text)
 RETURNS text
 LANGUAGE plpgsql
 VOLATILE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _attempt_count INTEGER;
  _rate_limit_window INTERVAL := '15 minutes';
  _max_attempts INTEGER := 10;
  _result_email TEXT;
BEGIN
  -- Check rate limit: max 10 attempts per 15 minutes per client
  SELECT COUNT(*) INTO _attempt_count
  FROM public.login_attempts
  WHERE client_identifier = _client_id
    AND attempted_at > now() - _rate_limit_window;
  
  IF _attempt_count >= _max_attempts THEN
    -- Return NULL to indicate rate limit without revealing if user exists
    RETURN NULL;
  END IF;
  
  -- Log this attempt
  INSERT INTO public.login_attempts (client_identifier, username_attempted)
  VALUES (_client_id, _display_name);
  
  -- Perform the actual lookup
  SELECT au.email INTO _result_email
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  WHERE LOWER(p.display_name) = LOWER(_display_name)
  LIMIT 1;
  
  RETURN _result_email;
END;
$function$;