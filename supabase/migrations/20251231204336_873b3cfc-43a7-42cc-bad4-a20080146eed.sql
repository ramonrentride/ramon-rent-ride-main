-- Create booking rate limit attempts table (similar to coupon_validation_attempts)
CREATE TABLE booking_creation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_identifier TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  was_successful BOOLEAN DEFAULT false
);

-- Create index for efficient rate limit lookups
CREATE INDEX idx_booking_attempts_client_time 
ON booking_creation_attempts(client_identifier, attempted_at DESC);

-- Enable RLS
ALTER TABLE booking_creation_attempts ENABLE ROW LEVEL SECURITY;

-- Allow system inserts for rate limiting (same pattern as coupon_validation_attempts)
CREATE POLICY "Allow system inserts for rate limiting"
ON booking_creation_attempts
FOR INSERT
WITH CHECK (true);

-- Only admins can view attempts
CREATE POLICY "Admins can view booking attempts"
ON booking_creation_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to check booking rate limit
CREATE OR REPLACE FUNCTION check_booking_rate_limit(_client_id TEXT)
RETURNS TABLE(allowed BOOLEAN, attempts_remaining INTEGER, retry_after_seconds INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _attempt_count INTEGER;
  _max_attempts CONSTANT INTEGER := 10;
  _window_seconds CONSTANT INTEGER := 3600; -- 1 hour
  _oldest_attempt TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Count attempts in the last hour
  SELECT COUNT(*), MIN(attempted_at) 
  INTO _attempt_count, _oldest_attempt
  FROM booking_creation_attempts
  WHERE client_identifier = _client_id
    AND attempted_at > now() - (_window_seconds || ' seconds')::INTERVAL;
  
  -- Return rate limit status
  IF _attempt_count >= _max_attempts THEN
    RETURN QUERY SELECT 
      false AS allowed,
      0 AS attempts_remaining,
      GREATEST(0, EXTRACT(EPOCH FROM (_oldest_attempt + (_window_seconds || ' seconds')::INTERVAL - now()))::INTEGER) AS retry_after_seconds;
  ELSE
    RETURN QUERY SELECT 
      true AS allowed,
      (_max_attempts - _attempt_count)::INTEGER AS attempts_remaining,
      0 AS retry_after_seconds;
  END IF;
END;
$$;

-- Create function to log booking attempt
CREATE OR REPLACE FUNCTION log_booking_attempt(_client_id TEXT, _was_successful BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO booking_creation_attempts (client_identifier, was_successful)
  VALUES (_client_id, _was_successful);
END;
$$;

-- Create cleanup function for old attempts (same pattern as coupon attempts)
CREATE OR REPLACE FUNCTION cleanup_old_booking_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM booking_creation_attempts
  WHERE attempted_at < now() - INTERVAL '24 hours';
END;
$$;