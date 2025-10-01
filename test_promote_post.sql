-- SQL to promote an existing post for testing
-- This will promote the "Social Memes is coming soon" post (id: 5b765f01-a4aa-48ee-b3fd-5bf05e9674b6)

UPDATE posts 
SET 
  is_promoted = true,
  promotion_start = NOW(),
  promotion_end = NOW() + INTERVAL '24 hours',
  promotion_price = 0.1,
  payment_tx_hash = 'TEST_TX_HASH_FOR_TESTING_12345',
  updated_at = NOW()
WHERE id = '5b765f01-a4aa-48ee-b3fd-5bf05e9674b6';

-- Verify the update
SELECT 
  id,
  content,
  is_promoted,
  promotion_start,
  promotion_end,
  promotion_price,
  payment_tx_hash
FROM posts 
WHERE id = '5b765f01-a4aa-48ee-b3fd-5bf05e9674b6';
