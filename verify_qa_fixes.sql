-- Verification Script: QA Fixes
-- Run this to verify the system flows
BEGIN;

RAISE NOTICE '--- 1. Verifying Database Structure ---';
DO $$
DECLARE
    v_missing_cols INTEGER;
BEGIN
    SELECT count(*) INTO v_missing_cols
    FROM information_schema.columns
    WHERE table_name = 'bikes' 
    AND column_name IN ('qr_string', 'active_order_id', 'active_phone');
    
    IF v_missing_cols < 3 THEN
        RAISE EXCEPTION '❌ Database Integrity Check Failed: Missing columns in bikes table.';
    ELSE
        RAISE NOTICE '✅ Database Integrity: OK (Columns Exist)';
    END IF;
END $$;

RAISE NOTICE '--- 2. Simulating Booking & Bike Trigger ---';
DO $$
DECLARE
    v_booking_id UUID;
    v_bike_id INTEGER;
    v_count INTEGER;
BEGIN
    -- Select a bike to test
    SELECT id INTO v_bike_id FROM bikes WHERE status = 'available' LIMIT 1;
    IF v_bike_id IS NULL THEN
        RAISE NOTICE '⚠️ No available bikes for test, resetting one...';
        UPDATE bikes SET status = 'available', active_order_id = NULL WHERE id = (SELECT id FROM bikes LIMIT 1);
        SELECT id INTO v_bike_id FROM bikes LIMIT 1;
    END IF;

    -- Setup Bike Data
    UPDATE bikes SET qr_string = 'TEST_QR_XYZ', sticker_number = 'TEST_ST' WHERE id = v_bike_id;

    -- Create Booking
    INSERT INTO bookings (
        date, session, riders, status, total_price, security_hold, phone, email, legal_accepted
    ) VALUES (
        CURRENT_DATE, 'morning',
        jsonb_build_array(jsonb_build_object('name', 'Test Rider', 'height', 180, 'assignedBike', v_bike_id)),
        'confirmed', 100, 50, '0501112233', 'test@qa.com', true
    ) RETURNING id INTO v_booking_id;
    
    RAISE NOTICE '   Booking Created: %', v_booking_id;

    -- Check Trigger Result
    SELECT count(*) INTO v_count FROM bikes 
    WHERE id = v_bike_id AND active_order_id = v_booking_id AND active_phone = '0501112233' AND status = 'rented';
    
    IF v_count = 1 THEN
        RAISE NOTICE '✅ Frontend Logic: PASS (Bike updated with OrderId & Phone)';
    ELSE
        RAISE EXCEPTION '❌ Frontend Logic Failed: Bike was not updated correctly. Frontend should have handled this!';
    END IF;
    
    -- Store for next steps in temp table if needed, or just nested block this
    -- We continue in same block
    
    RAISE NOTICE '--- 3. Testing Verify QR Scan (Security) ---';
    -- Valid
    IF verify_qr_scan('TEST_QR_XYZ', '0501112233') IS TRUE THEN
        RAISE NOTICE '✅ verify_qr_scan (Valid credentials): PASS';
    ELSE
        RAISE EXCEPTION '❌ verify_qr_scan Failed for valid data.';
    END IF;
    
    -- Invalid
    IF verify_qr_scan('TEST_QR_XYZ', '0509999999') IS FALSE THEN
        RAISE NOTICE '✅ verify_qr_scan (Invalid phone): PASS';
    ELSE
        RAISE EXCEPTION '❌ verify_qr_scan Should have failed for invalid phone!';
    END IF;

    RAISE NOTICE '--- 4. Testing Get Lock Codes ---';
    DECLARE
        v_code_count INTEGER := 0;
        r RECORD;
    BEGIN
        FOR r IN SELECT * FROM get_order_lock_codes(v_booking_id, '0501112233') LOOP
            RAISE NOTICE '   Found Lock Code for Bike %: %', r.sticker_number, r.lock_code;
            v_code_count := v_code_count + 1;
        END LOOP;
        
        IF v_code_count > 0 THEN
            RAISE NOTICE '✅ get_order_lock_codes: PASS';
        ELSE
            RAISE EXCEPTION '❌ get_order_lock_codes Returned no rows!';
        END IF;
    END;

    RAISE NOTICE '--- 5. Testing Availability Logic ---';
    IF check_bike_availability(ARRAY[v_bike_id], CURRENT_DATE, 'morning') IS FALSE THEN
        RAISE NOTICE '✅ check_bike_availability (Busy): PASS';
    ELSE
        RAISE EXCEPTION '❌ check_bike_availability Should be false for rented bike!';
    END IF;

    RAISE NOTICE '--- 6. Testing Release Flow ---';
    PERFORM release_bike_from_order(v_bike_id);
    
    -- Check DB
    SELECT count(*) INTO v_count FROM bikes 
    WHERE id = v_bike_id AND status = 'available' AND active_order_id IS NULL;
    
    IF v_count = 1 THEN
        RAISE NOTICE '✅ release_bike_from_order: PASS';
    ELSE
        RAISE EXCEPTION '❌ release_bike_from_order Failed to clean up bike.';
    END IF;

    -- Check logic again
    IF check_bike_availability(ARRAY[v_bike_id], CURRENT_DATE, 'morning') IS TRUE THEN
        RAISE NOTICE '✅ check_bike_availability (Free): PASS';
    ELSE
        RAISE EXCEPTION '❌ check_bike_availability Should be true after release!';
    END IF;
    
    RAISE NOTICE ' ';
    RAISE NOTICE '🟢🟢🟢 SYSTEM QA CHECK PASSED SUCCESSFULLY 🟢🟢🟢';

END $$;

ROLLBACK; -- Clean up test data
