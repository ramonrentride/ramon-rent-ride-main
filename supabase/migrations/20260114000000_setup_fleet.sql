-- Migration to setup the initial fleet of 15 bikes
-- Fixes: Removes lock_code from bikes table insert, uses separate bike_lock_codes table.

-- 1. Clean up existing data
TRUNCATE TABLE public.bikes CASCADE;
-- Note: TRUNCATE ... CASCADE should clear bike_lock_codes if foreign keys are set up correctly. 
-- If not, we might need: TRUNCATE TABLE public.bike_lock_codes;

-- 2. Insert Bikes and mapping to Lock Codes
WITH new_bikes AS (
  INSERT INTO public.bikes (sticker_number, size, status)
  VALUES
    -- Size S (4 bikes)
    ('RRR-001', 'S', 'available'),
    ('RRR-002', 'S', 'available'),
    ('RRR-003', 'S', 'available'),
    ('RRR-004', 'S', 'available'),

    -- Size M (5 bikes)
    ('RRR-005', 'M', 'available'),
    ('RRR-006', 'M', 'available'),
    ('RRR-007', 'M', 'available'),
    ('RRR-008', 'M', 'available'),
    ('RRR-009', 'M', 'available'),

    -- Size L (4 bikes)
    ('RRR-010', 'L', 'available'),
    ('RRR-011', 'L', 'available'),
    ('RRR-012', 'L', 'available'),
    ('RRR-013', 'L', 'available'),

    -- Size XL (2 bikes)
    ('RRR-014', 'XL', 'available'),
    ('RRR-015', 'XL', 'available')
  RETURNING id, sticker_number
)
INSERT INTO public.bike_lock_codes (bike_id, lock_code)
SELECT 
  id, 
  CASE 
    WHEN sticker_number = 'RRR-001' THEN '1001'
    WHEN sticker_number = 'RRR-002' THEN '1002'
    WHEN sticker_number = 'RRR-003' THEN '1003'
    WHEN sticker_number = 'RRR-004' THEN '1004'
    WHEN sticker_number = 'RRR-005' THEN '1005'
    WHEN sticker_number = 'RRR-006' THEN '1006'
    WHEN sticker_number = 'RRR-007' THEN '1007'
    WHEN sticker_number = 'RRR-008' THEN '1008'
    WHEN sticker_number = 'RRR-009' THEN '1009'
    WHEN sticker_number = 'RRR-010' THEN '1010'
    WHEN sticker_number = 'RRR-011' THEN '1011'
    WHEN sticker_number = 'RRR-012' THEN '1012'
    WHEN sticker_number = 'RRR-013' THEN '1013'
    WHEN sticker_number = 'RRR-014' THEN '1014'
    WHEN sticker_number = 'RRR-015' THEN '1015'
    ELSE '0000'
  END
FROM new_bikes;
