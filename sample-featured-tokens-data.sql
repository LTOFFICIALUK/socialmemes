-- Sample Featured Tokens data for testing platform revenue calculation
-- These records will generate platform revenue when calculating for the current period

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
-- Recent Featured Token purchases (within current period 2025-10-01 to 2025-10-14)
(
  (SELECT id FROM profiles LIMIT 1 OFFSET 0),
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
  (SELECT id FROM profiles LIMIT 1 OFFSET 1),
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
  (SELECT id FROM profiles LIMIT 1 OFFSET 2),
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
  (SELECT id FROM profiles LIMIT 1 OFFSET 3),
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
  (SELECT id FROM profiles LIMIT 1 OFFSET 4),
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
  (SELECT id FROM profiles LIMIT 1 OFFSET 5),
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
  (SELECT id FROM profiles LIMIT 1 OFFSET 6),
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
  (SELECT id FROM profiles LIMIT 1 OFFSET 7),
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

-- Verify the inserted data
SELECT 
  title,
  promotion_price,
  created_at,
  payment_tx_hash
FROM featured_tokens 
WHERE created_at >= '2025-10-01' 
  AND created_at < '2025-10-15'
ORDER BY created_at;

-- Calculate total Featured Tokens revenue for current period
SELECT 
  COUNT(*) as token_count,
  SUM(promotion_price) as total_revenue_sol
FROM featured_tokens 
WHERE created_at >= '2025-10-01' 
  AND created_at < '2025-10-15';
