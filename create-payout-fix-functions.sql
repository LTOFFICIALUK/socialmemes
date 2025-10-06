-- Create functions to fix duplicate payouts
-- These functions will be called by the API endpoint

-- Function to clean up duplicate payouts
CREATE OR REPLACE FUNCTION cleanup_duplicate_payouts()
RETURNS TEXT AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete duplicates, keeping only the most recent entry for each user/period combination
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
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN 'Deleted ' || deleted_count || ' duplicate payout entries';
END;
$$ LANGUAGE plpgsql;

-- Function to add unique constraint
CREATE OR REPLACE FUNCTION add_payout_unique_constraint()
RETURNS TEXT AS $$
BEGIN
  -- Add unique constraint if it doesn't exist
  BEGIN
    ALTER TABLE user_payouts 
    ADD CONSTRAINT user_payouts_unique_user_period 
    UNIQUE (user_id, period_start, period_end);
    
    RETURN 'Unique constraint added successfully';
  EXCEPTION
    WHEN duplicate_object THEN
      RETURN 'Unique constraint already exists';
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql;
