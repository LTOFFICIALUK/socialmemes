-- ⚠️  CRITICAL: Run this SQL in Supabase SQL Editor NOW!
-- This adds the missing unique constraint that the payout system needs

-- Add unique constraint to user_payouts table (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'user_payouts'
        AND constraint_name = 'user_payouts_unique_user_period'
        AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE user_payouts
        ADD CONSTRAINT user_payouts_unique_user_period UNIQUE (user_id, period_start, period_end);
        
        RAISE NOTICE 'Added unique constraint to user_payouts table';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on user_payouts table';
    END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS user_payouts_user_period_idx 
ON user_payouts(user_id, period_start, period_end);

-- Verify the constraint exists
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_payouts' 
  AND tc.constraint_type = 'UNIQUE'
GROUP BY tc.constraint_name, tc.table_name;

