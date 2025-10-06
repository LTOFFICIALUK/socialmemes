-- Update get_current_period function to return all columns including revenue data
-- Drop the existing function first
DROP FUNCTION IF EXISTS get_current_period();

-- Recreate the function with all columns
CREATE OR REPLACE FUNCTION get_current_period()
RETURNS TABLE (
  id UUID,
  period_start DATE,
  period_end DATE,
  period_name TEXT,
  year INTEGER,
  month INTEGER,
  period_number INTEGER,
  is_current BOOLEAN,
  is_future BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  pumpfun_fees_sol NUMERIC(20,9),
  platform_revenue_sol NUMERIC(20,9),
  pumpfun_pool_sol NUMERIC(20,9),
  platform_pool_sol NUMERIC(20,9),
  total_pool_sol NUMERIC(20,9),
  referral_bonus_pool_sol NUMERIC(20,9),
  revenue_status TEXT,
  pumpfun_creator_wallet TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bp.id,
    bp.period_start,
    bp.period_end,
    bp.period_name,
    bp.year,
    bp.month,
    bp.period_number,
    bp.is_current,
    bp.is_future,
    bp.created_at,
    bp.updated_at,
    bp.pumpfun_fees_sol,
    bp.platform_revenue_sol,
    bp.pumpfun_pool_sol,
    bp.platform_pool_sol,
    bp.total_pool_sol,
    bp.referral_bonus_pool_sol,
    bp.revenue_status,
    bp.pumpfun_creator_wallet
  FROM biweekly_periods bp
  WHERE bp.is_current = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

