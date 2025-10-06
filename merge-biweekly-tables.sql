-- Merge biweekly_periods and biweekly_revenue tables
-- Since biweekly_revenue is empty, we can safely add columns and drop the table

-- Step 1: Add revenue columns to biweekly_periods table
ALTER TABLE biweekly_periods 
ADD COLUMN IF NOT EXISTS pumpfun_fees_sol DECIMAL(20,9) DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_revenue_sol DECIMAL(20,9) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pumpfun_pool_sol DECIMAL(20,9) DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_pool_sol DECIMAL(20,9) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_pool_sol DECIMAL(20,9) DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_bonus_pool_sol DECIMAL(20,9) DEFAULT 0,
ADD COLUMN IF NOT EXISTS revenue_status TEXT CHECK (revenue_status IN ('pending', 'calculated', 'paid')) DEFAULT 'pending';

-- Step 2: Add index for revenue queries
CREATE INDEX IF NOT EXISTS biweekly_periods_revenue_status_idx ON biweekly_periods(revenue_status);

-- Step 3: Drop the biweekly_revenue table (since it's empty)
DROP TABLE IF EXISTS biweekly_revenue;

-- Step 4: Drop and recreate the get_periods_by_category function to use the merged table
DROP FUNCTION IF EXISTS get_periods_by_category();

CREATE OR REPLACE FUNCTION get_periods_by_category()
RETURNS TABLE (
  category TEXT,
  id UUID,
  period_start DATE,
  period_end DATE,
  period_name TEXT,
  year INTEGER,
  month INTEGER,
  period_number INTEGER,
  has_revenue_data BOOLEAN,
  revenue_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN bp.period_end < CURRENT_DATE THEN 'past'
      WHEN bp.period_start <= CURRENT_DATE AND bp.period_end >= CURRENT_DATE THEN 'current'
      WHEN bp.period_start > CURRENT_DATE THEN 'future'
    END as category,
    bp.id,
    bp.period_start,
    bp.period_end,
    bp.period_name,
    bp.year,
    bp.month,
    bp.period_number,
    CASE WHEN bp.revenue_status != 'pending' OR bp.total_pool_sol > 0 THEN TRUE ELSE FALSE END as has_revenue_data,
    COALESCE(bp.revenue_status, 'no_data') as revenue_status
  FROM biweekly_periods bp
  ORDER BY bp.period_start DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON COLUMN biweekly_periods.pumpfun_fees_sol IS 'PumpFun fees collected during this period';
COMMENT ON COLUMN biweekly_periods.platform_revenue_sol IS 'Platform revenue (Pro subs + promotions + featured tokens)';
COMMENT ON COLUMN biweekly_periods.pumpfun_pool_sol IS '40% of PumpFun fees for user payouts';
COMMENT ON COLUMN biweekly_periods.platform_pool_sol IS '50% of platform revenue for user payouts';
COMMENT ON COLUMN biweekly_periods.total_pool_sol IS 'Total SOL available for user payouts';
COMMENT ON COLUMN biweekly_periods.referral_bonus_pool_sol IS 'Pool for referral bonuses (5% of user earnings)';
COMMENT ON COLUMN biweekly_periods.revenue_status IS 'Status of revenue data and calculations';

-- Verify the changes
SELECT 
  'MERGED TABLE STRUCTURE' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'biweekly_periods' 
AND table_schema = 'public'
ORDER BY ordinal_position;
