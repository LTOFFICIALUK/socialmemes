-- Sample Pro Subscriptions data for testing platform revenue calculation
-- These records will generate platform revenue when calculating for the current period

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
-- Recent Pro Subscription purchases (within current period 2025-10-01 to 2025-10-14)
(
  (SELECT id FROM profiles LIMIT 1 OFFSET 8),
  1,
  10.0,
  'active',
  '3R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7',
  '2025-10-01 09:30:00+00',
  '2025-10-01 09:30:00+00',
  '2025-11-01 09:30:00+00'
),
(
  (SELECT id FROM profiles LIMIT 1 OFFSET 9),
  3,
  25.0,
  'active',
  '4S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8',
  '2025-10-02 14:15:00+00',
  '2025-10-02 14:15:00+00',
  '2026-01-02 14:15:00+00'
),
(
  (SELECT id FROM profiles LIMIT 1 OFFSET 10),
  1,
  10.0,
  'active',
  '5T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9',
  '2025-10-03 11:45:00+00',
  '2025-10-03 11:45:00+00',
  '2025-11-03 11:45:00+00'
),
(
  (SELECT id FROM profiles LIMIT 1 OFFSET 11),
  6,
  45.0,
  'active',
  '6U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0',
  '2025-10-04 16:20:00+00',
  '2025-10-04 16:20:00+00',
  '2026-04-04 16:20:00+00'
),
(
  (SELECT id FROM profiles LIMIT 1 OFFSET 12),
  1,
  10.0,
  'active',
  '7V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1',
  '2025-10-05 08:10:00+00',
  '2025-10-05 08:10:00+00',
  '2025-11-05 08:10:00+00'
),
(
  (SELECT id FROM profiles LIMIT 1 OFFSET 13),
  3,
  25.0,
  'active',
  '8W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2',
  '2025-10-06 13:35:00+00',
  '2025-10-06 13:35:00+00',
  '2026-01-06 13:35:00+00'
),
(
  (SELECT id FROM profiles LIMIT 1 OFFSET 14),
  1,
  10.0,
  'active',
  '9X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3',
  '2025-10-07 10:55:00+00',
  '2025-10-07 10:55:00+00',
  '2025-11-07 10:55:00+00'
),
(
  (SELECT id FROM profiles LIMIT 1 OFFSET 15),
  12,
  80.0,
  'active',
  '0Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4',
  '2025-10-08 15:40:00+00',
  '2025-10-08 15:40:00+00',
  '2026-10-08 15:40:00+00'
),
(
  (SELECT id FROM profiles LIMIT 1 OFFSET 16),
  1,
  10.0,
  'active',
  '1Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5',
  '2025-10-09 12:25:00+00',
  '2025-10-09 12:25:00+00',
  '2025-11-09 12:25:00+00'
),
(
  (SELECT id FROM profiles LIMIT 1 OFFSET 17),
  3,
  25.0,
  'active',
  '2A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6',
  '2025-10-10 09:15:00+00',
  '2025-10-10 09:15:00+00',
  '2026-01-10 09:15:00+00'
),
(
  (SELECT id FROM profiles LIMIT 1 OFFSET 18),
  1,
  10.0,
  'active',
  '3B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7',
  '2025-10-11 17:50:00+00',
  '2025-10-11 17:50:00+00',
  '2025-11-11 17:50:00+00'
),
(
  (SELECT id FROM profiles LIMIT 1 OFFSET 19),
  6,
  45.0,
  'active',
  '4C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7I8',
  '2025-10-12 14:05:00+00',
  '2025-10-12 14:05:00+00',
  '2026-04-12 14:05:00+00'
),
(
  (SELECT id FROM profiles LIMIT 1 OFFSET 20),
  1,
  10.0,
  'active',
  '5D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7I8J9',
  '2025-10-13 11:30:00+00',
  '2025-10-13 11:30:00+00',
  '2025-11-13 11:30:00+00'
),
(
  (SELECT id FROM profiles LIMIT 1 OFFSET 21),
  3,
  25.0,
  'active',
  '6E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7I8J9K0',
  '2025-10-14 08:45:00+00',
  '2025-10-14 08:45:00+00',
  '2026-01-14 08:45:00+00'
);

-- Verify the inserted data
SELECT 
  duration_months,
  price_sol,
  status,
  created_at,
  payment_tx_hash
FROM pro_subscriptions 
WHERE created_at >= '2025-10-01' 
  AND created_at < '2025-10-15'
ORDER BY created_at;

-- Calculate total Pro Subscriptions revenue for current period
SELECT 
  COUNT(*) as subscription_count,
  SUM(price_sol) as total_revenue_sol
FROM pro_subscriptions 
WHERE created_at >= '2025-10-01' 
  AND created_at < '2025-10-15'
  AND status = 'active';

-- Summary of all platform revenue for current period
SELECT 
  'Featured Tokens' as source,
  COUNT(*) as count,
  SUM(promotion_price) as total_sol
FROM featured_tokens 
WHERE created_at >= '2025-10-01' 
  AND created_at < '2025-10-15'

UNION ALL

SELECT 
  'Pro Subscriptions' as source,
  COUNT(*) as count,
  SUM(price_sol) as total_sol
FROM pro_subscriptions 
WHERE created_at >= '2025-10-01' 
  AND created_at < '2025-10-15'
  AND status = 'active';
