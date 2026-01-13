-- Add CHECK constraints for email and phone validation
ALTER TABLE bookings
ADD CONSTRAINT check_email_format 
CHECK (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' AND length(email) <= 255);

ALTER TABLE bookings
ADD CONSTRAINT check_phone_format
CHECK (phone ~ '^05\d{8}$');

-- Create validation function for riders JSONB array
CREATE OR REPLACE FUNCTION validate_booking_riders()
RETURNS TRIGGER AS $$
DECLARE
  rider JSONB;
  rider_name TEXT;
  rider_height INT;
BEGIN
  -- Check riders array is not empty and not too large
  IF jsonb_array_length(NEW.riders) < 1 THEN
    RAISE EXCEPTION 'At least one rider is required';
  END IF;
  
  IF jsonb_array_length(NEW.riders) > 20 THEN
    RAISE EXCEPTION 'Maximum 20 riders allowed';
  END IF;
  
  -- Validate each rider
  FOR rider IN SELECT * FROM jsonb_array_elements(NEW.riders)
  LOOP
    -- Validate rider name exists and is within length limits
    rider_name := rider->>'name';
    IF rider_name IS NULL OR length(rider_name) < 2 OR length(rider_name) > 50 THEN
      RAISE EXCEPTION 'Rider name must be between 2 and 50 characters';
    END IF;
    
    -- Validate rider name contains only allowed characters (letters, spaces, hyphens, apostrophes, Hebrew)
    IF rider_name !~ '^[\u0590-\u05FFa-zA-Z\s''\-]+$' THEN
      RAISE EXCEPTION 'Rider name contains invalid characters';
    END IF;
    
    -- Validate height if provided
    IF rider ? 'height' THEN
      rider_height := (rider->>'height')::INT;
      IF rider_height < 120 OR rider_height > 210 THEN
        RAISE EXCEPTION 'Rider height must be between 120cm and 210cm';
      END IF;
    END IF;
  END LOOP;
  
  -- Sanitize text fields - remove potential HTML tags
  NEW.email := regexp_replace(NEW.email, '<[^>]*>', '', 'g');
  NEW.phone := regexp_replace(NEW.phone, '<[^>]*>', '', 'g');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Create trigger to validate bookings on INSERT and UPDATE
CREATE TRIGGER validate_booking_data
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION validate_booking_riders();