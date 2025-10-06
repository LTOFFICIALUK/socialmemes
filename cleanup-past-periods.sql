-- Cleanup: Remove past periods before platform launch
-- This will delete all periods that ended before the current period

-- First, let's see what we're about to delete
SELECT 
  'PAST PERIODS TO DELETE' as action,
  COUNT(*) as count,
  MIN(period_start) as earliest_period,
  MAX(period_end) as latest_period
FROM biweekly_periods 
WHERE period_end < '2025-10-01';

-- Show the specific periods that will be deleted
SELECT 
  period_name,
  period_start,
  period_end,
  year,
  month,
  period_number
FROM biweekly_periods 
WHERE period_end < '2025-10-01'
ORDER BY period_start;

-- Delete all past periods (everything before October 1, 2025)
DELETE FROM biweekly_periods 
WHERE period_end < '2025-10-01';

-- Verify the cleanup
SELECT 
  'REMAINING PERIODS' as action,
  COUNT(*) as total_count,
  SUM(CASE WHEN is_current = TRUE THEN 1 ELSE 0 END) as current_periods,
  SUM(CASE WHEN is_future = TRUE THEN 1 ELSE 0 END) as future_periods,
  MIN(period_start) as earliest_period,
  MAX(period_end) as latest_period
FROM biweekly_periods;

-- Show remaining periods
SELECT 
  period_name,
  period_start,
  period_end,
  year,
  month,
  period_number,
  is_current,
  is_future
FROM biweekly_periods 
ORDER BY period_start;
