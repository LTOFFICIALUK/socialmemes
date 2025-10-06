-- Setup script for platform revenue testing (FIXED VERSION)
-- This script ensures we have enough profiles and populates sample data

-- ============================================
-- STEP 1: Check and create profiles if needed
-- ============================================

DO $$
DECLARE
    profile_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles;
    
    IF profile_count < 25 THEN
        RAISE NOTICE 'Found % profiles. Creating additional test profiles...', profile_count;
        
        -- Create additional profiles to reach 25
        FOR i IN (profile_count + 1)..25 LOOP
            INSERT INTO profiles (
                id,
                username,
                full_name,
                bio,
                pro,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                'test_user_' || i,
                'Test User ' || i,
                'Test profile for platform revenue testing',
                true,
                NOW(),
                NOW()
            );
        END LOOP;
        
        RAISE NOTICE 'Created % additional test profiles.', 25 - profile_count;
    ELSE
        RAISE NOTICE 'Found % profiles. No additional profiles needed.', profile_count;
    END IF;
END $$;

-- ============================================
-- STEP 2: Clear existing test data (optional)
-- ============================================

-- Uncomment the following lines if you want to clear existing test data first
-- DELETE FROM pro_subscriptions WHERE created_at >= '2025-10-01' AND created_at < '2025-10-15';
-- DELETE FROM featured_tokens WHERE created_at >= '2025-10-01' AND created_at < '2025-10-15';

-- ============================================
-- STEP 3: Insert Featured Tokens data
-- ============================================

INSERT INTO featured_tokens (
  user_id,
  title,
  image_url,
  destination_url,
  is_active,
  promotion_start,
  promotion_end,
  promotion_price,
  payment_tx_hash,
  display_order,
  created_at,
  payment_from_address
) VALUES 
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 0),
  'Dogecoin Killer',
  'https://example.com/doge-killer.png',
  'https://pump.fun/doge-killer',
  true,
  '2025-10-02 10:00:00+00',
  '2025-10-09 10:00:00+00',
  5.5,
  '5J7X8K9L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0',
  1,
  '2025-10-02 10:15:00+00',
  '7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 1),
  'Solana Moon',
  'https://example.com/sol-moon.png',
  'https://pump.fun/sol-moon',
  true,
  '2025-10-03 14:30:00+00',
  '2025-10-10 14:30:00+00',
  8.25,
  '6K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0',
  2,
  '2025-10-03 14:45:00+00',
  '8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 2),
  'Pepe 2.0',
  'https://example.com/pepe-v2.png',
  'https://pump.fun/pepe-v2',
  true,
  '2025-10-05 09:00:00+00',
  '2025-10-12 09:00:00+00',
  12.0,
  '7L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1',
  3,
  '2025-10-05 09:20:00+00',
  '9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 3),
  'Bitcoin Maximalist',
  'https://example.com/btc-max.png',
  'https://pump.fun/btc-max',
  true,
  '2025-10-07 16:45:00+00',
  '2025-10-14 16:45:00+00',
  15.75,
  '8M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2',
  4,
  '2025-10-07 17:00:00+00',
  '0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 4),
  'Ethereum Classic',
  'https://example.com/eth-classic.png',
  'https://pump.fun/eth-classic',
  true,
  '2025-10-10 11:30:00+00',
  '2025-10-17 11:30:00+00',
  6.5,
  '9N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3',
  5,
  '2025-10-10 11:45:00+00',
  '1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 5),
  'Chainlink Oracle',
  'https://example.com/link-oracle.png',
  'https://pump.fun/link-oracle',
  true,
  '2025-10-12 13:15:00+00',
  '2025-10-19 13:15:00+00',
  9.25,
  '0O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4',
  6,
  '2025-10-12 13:30:00+00',
  '2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 6),
  'Polygon MATIC',
  'https://example.com/matic-polygon.png',
  'https://pump.fun/matic-polygon',
  true,
  '2025-10-13 08:20:00+00',
  '2025-10-20 08:20:00+00',
  4.75,
  '1P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5',
  7,
  '2025-10-13 08:35:00+00',
  '3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 7),
  'Avalanche Rush',
  'https://example.com/avax-rush.png',
  'https://pump.fun/avax-rush',
  true,
  '2025-10-14 15:10:00+00',
  '2025-10-21 15:10:00+00',
  11.5,
  '2Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6',
  8,
  '2025-10-14 15:25:00+00',
  '4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6'
);

-- ============================================
-- STEP 4: Insert Pro Subscriptions data
-- ============================================

INSERT INTO pro_subscriptions (
  user_id,
  duration_months,
  price_sol,
  status,
  payment_tx_hash,
  created_at,
  activated_at,
  expires_at
) VALUES 
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 8),
  1,
  10.0,
  'active',
  '3R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7',
  '2025-10-01 09:30:00+00',
  '2025-10-01 09:30:00+00',
  '2025-11-01 09:30:00+00'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 9),
  3,
  25.0,
  'active',
  '4S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8',
  '2025-10-02 14:15:00+00',
  '2025-10-02 14:15:00+00',
  '2026-01-02 14:15:00+00'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 10),
  1,
  10.0,
  'active',
  '5T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9',
  '2025-10-03 11:45:00+00',
  '2025-10-03 11:45:00+00',
  '2025-11-03 11:45:00+00'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 11),
  6,
  45.0,
  'active',
  '6U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0',
  '2025-10-04 16:20:00+00',
  '2025-10-04 16:20:00+00',
  '2026-04-04 16:20:00+00'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 12),
  1,
  10.0,
  'active',
  '7V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1',
  '2025-10-05 08:10:00+00',
  '2025-10-05 08:10:00+00',
  '2025-11-05 08:10:00+00'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 13),
  3,
  25.0,
  'active',
  '8W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2',
  '2025-10-06 13:35:00+00',
  '2025-10-06 13:35:00+00',
  '2026-01-06 13:35:00+00'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 14),
  1,
  10.0,
  'active',
  '9X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3',
  '2025-10-07 10:55:00+00',
  '2025-10-07 10:55:00+00',
  '2025-11-07 10:55:00+00'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 15),
  12,
  80.0,
  'active',
  '0Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4',
  '2025-10-08 15:40:00+00',
  '2025-10-08 15:40:00+00',
  '2026-10-08 15:40:00+00'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 16),
  1,
  10.0,
  'active',
  '1Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5',
  '2025-10-09 12:25:00+00',
  '2025-10-09 12:25:00+00',
  '2025-11-09 12:25:00+00'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 17),
  3,
  25.0,
  'active',
  '2A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6',
  '2025-10-10 09:15:00+00',
  '2025-10-10 09:15:00+00',
  '2026-01-10 09:15:00+00'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 18),
  1,
  10.0,
  'active',
  '3B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7',
  '2025-10-11 17:50:00+00',
  '2025-10-11 17:50:00+00',
  '2025-11-11 17:50:00+00'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 19),
  6,
  45.0,
  'active',
  '4C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7I8',
  '2025-10-12 14:05:00+00',
  '2025-10-12 14:05:00+00',
  '2026-04-12 14:05:00+00'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 20),
  1,
  10.0,
  'active',
  '5D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7I8J9',
  '2025-10-13 11:30:00+00',
  '2025-10-13 11:30:00+00',
  '2025-11-13 11:30:00+00'
),
(
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 21),
  3,
  25.0,
  'active',
  '6E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7I8J9K0',
  '2025-10-14 08:45:00+00',
  '2025-10-14 08:45:00+00',
  '2026-01-14 08:45:00+00'
);

-- ============================================
-- STEP 5: Verification and Summary
-- ============================================

-- Featured Tokens Summary
SELECT 
  'Featured Tokens' as source,
  COUNT(*) as count,
  SUM(promotion_price) as total_sol,
  ROUND(SUM(promotion_price) * 0.5, 4) as pool_50_percent
FROM featured_tokens 
WHERE created_at >= '2025-10-01' 
  AND created_at < '2025-10-15';

-- Pro Subscriptions Summary  
SELECT 
  'Pro Subscriptions' as source,
  COUNT(*) as count,
  SUM(price_sol) as total_sol,
  ROUND(SUM(price_sol) * 0.5, 4) as pool_50_percent
FROM pro_subscriptions 
WHERE created_at >= '2025-10-01' 
  AND created_at < '2025-10-15'
  AND status = 'active';

-- Combined Platform Revenue Summary
SELECT 
  'TOTAL PLATFORM REVENUE' as source,
  (SELECT COUNT(*) FROM featured_tokens WHERE created_at >= '2025-10-01' AND created_at < '2025-10-15') +
  (SELECT COUNT(*) FROM pro_subscriptions WHERE created_at >= '2025-10-01' AND created_at < '2025-10-15' AND status = 'active') as total_transactions,
  (SELECT COALESCE(SUM(promotion_price), 0) FROM featured_tokens WHERE created_at >= '2025-10-01' AND created_at < '2025-10-15') +
  (SELECT COALESCE(SUM(price_sol), 0) FROM pro_subscriptions WHERE created_at >= '2025-10-01' AND created_at < '2025-10-15' AND status = 'active') as total_revenue_sol,
  ROUND(
    ((SELECT COALESCE(SUM(promotion_price), 0) FROM featured_tokens WHERE created_at >= '2025-10-01' AND created_at < '2025-10-15') +
     (SELECT COALESCE(SUM(price_sol), 0) FROM pro_subscriptions WHERE created_at >= '2025-10-01' AND created_at < '2025-10-15' AND status = 'active')) * 0.5, 
    4
  ) as total_platform_pool_sol;
