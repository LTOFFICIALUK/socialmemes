-- Fix user_payouts table to prevent duplicate entries for the same user and period
-- This adds a unique constraint and fixes the duplicate issue

-- First, clean up any existing duplicates by keeping only the most recent entry
WITH duplicates AS (
  SELECT user_id, period_start, period_end, 
         ROW_NUMBER() OVER (PARTITION BY user_id, period_start, period_end ORDER BY created_at DESC) as rn
  FROM user_payouts
),
to_delete AS (
  SELECT id FROM user_payouts up
  INNER JOIN duplicates d ON up.user_id = d.user_id 
    AND up.period_start = d.period_start 
    AND up.period_end = d.period_end
  WHERE d.rn > 1
)
DELETE FROM user_payouts WHERE id IN (SELECT id FROM to_delete);

-- Add unique constraint to prevent future duplicates
ALTER TABLE user_payouts 
ADD CONSTRAINT user_payouts_unique_user_period 
UNIQUE (user_id, period_start, period_end);

-- Add index for better performance (if it doesn't exist)
CREATE INDEX IF NOT EXISTS user_payouts_user_period_idx ON user_payouts(user_id, period_start, period_end);

-- Verify the constraint was added
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_payouts' 
  AND tc.constraint_type = 'UNIQUE'
  AND kcu.column_name IN ('user_id', 'period_start', 'period_end');
