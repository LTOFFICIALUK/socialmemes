-- Add unique constraint to referral_payouts table to prevent duplicate entries
-- This is required for the upsert operation in the referral payouts API

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'referral_payouts'
        AND constraint_name = 'referral_payouts_unique_referrer_period'
        AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE referral_payouts
        ADD CONSTRAINT referral_payouts_unique_referrer_period 
        UNIQUE (referrer_id, referred_user_id, period_start, period_end);
        
        RAISE NOTICE 'Added unique constraint to referral_payouts table';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on referral_payouts table';
    END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS referral_payouts_referrer_user_period_idx 
ON referral_payouts(referrer_id, referred_user_id, period_start, period_end);

-- Verify the constraint exists
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'referral_payouts' 
  AND tc.constraint_type = 'UNIQUE'
GROUP BY tc.constraint_name, tc.table_name;

