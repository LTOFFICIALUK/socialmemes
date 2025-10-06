-- Migration: Bi-weekly Periods System
-- This creates a system to track all bi-weekly periods for revenue sharing

-- Create bi-weekly periods table to track all periods
CREATE TABLE IF NOT EXISTS biweekly_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_name TEXT NOT NULL, -- e.g., "January 2024 - Period 1", "January 2024 - Period 2"
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  period_number INTEGER NOT NULL, -- 1 or 2 (first or second half of month)
  is_current BOOLEAN DEFAULT FALSE,
  is_future BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(period_start, period_end),
  UNIQUE(year, month, period_number)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS biweekly_periods_period_dates_idx ON biweekly_periods(period_start, period_end);
CREATE INDEX IF NOT EXISTS biweekly_periods_year_month_idx ON biweekly_periods(year, month);
CREATE INDEX IF NOT EXISTS biweekly_periods_current_idx ON biweekly_periods(is_current) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS biweekly_periods_future_idx ON biweekly_periods(is_future) WHERE is_future = TRUE;

-- Enable RLS
ALTER TABLE biweekly_periods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "System can manage all periods" ON biweekly_periods;
CREATE POLICY "System can manage all periods" ON biweekly_periods
  FOR ALL WITH CHECK (true);

-- Function to generate period name
CREATE OR REPLACE FUNCTION generate_period_name(year_val INTEGER, month_val INTEGER, period_num INTEGER)
RETURNS TEXT AS $$
DECLARE
  month_name TEXT;
BEGIN
  month_name := CASE month_val
    WHEN 1 THEN 'January'
    WHEN 2 THEN 'February'
    WHEN 3 THEN 'March'
    WHEN 4 THEN 'April'
    WHEN 5 THEN 'May'
    WHEN 6 THEN 'June'
    WHEN 7 THEN 'July'
    WHEN 8 THEN 'August'
    WHEN 9 THEN 'September'
    WHEN 10 THEN 'October'
    WHEN 11 THEN 'November'
    WHEN 12 THEN 'December'
  END;
  
  RETURN month_name || ' ' || year_val || ' - Period ' || period_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate all bi-weekly periods for a given year
CREATE OR REPLACE FUNCTION generate_biweekly_periods_for_year(year_val INTEGER)
RETURNS VOID AS $$
DECLARE
  month_val INTEGER;
  period_start DATE;
  period_end DATE;
  period_num INTEGER;
  period_name TEXT;
BEGIN
  -- Clear existing periods for this year
  DELETE FROM biweekly_periods WHERE year = year_val;
  
  -- Generate periods for each month
  FOR month_val IN 1..12 LOOP
    -- Period 1: 1st to 14th
    period_start := DATE(year_val || '-' || LPAD(month_val::TEXT, 2, '0') || '-01');
    period_end := DATE(year_val || '-' || LPAD(month_val::TEXT, 2, '0') || '-14');
    period_num := 1;
    period_name := generate_period_name(year_val, month_val, period_num);
    
    INSERT INTO biweekly_periods (period_start, period_end, period_name, year, month, period_number)
    VALUES (period_start, period_end, period_name, year_val, month_val, period_num);
    
    -- Period 2: 15th to end of month
    period_start := DATE(year_val || '-' || LPAD(month_val::TEXT, 2, '0') || '-15');
    period_end := (DATE(year_val || '-' || LPAD(month_val::TEXT, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    period_num := 2;
    period_name := generate_period_name(year_val, month_val, period_num);
    
    INSERT INTO biweekly_periods (period_start, period_end, period_name, year, month, period_number)
    VALUES (period_start, period_end, period_name, year_val, month_val, period_num);
  END LOOP;
  
  -- Update current and future flags
  PERFORM update_period_status_flags();
END;
$$ LANGUAGE plpgsql;

-- Function to update current and future period flags
CREATE OR REPLACE FUNCTION update_period_status_flags()
RETURNS VOID AS $$
BEGIN
  -- Reset all flags
  UPDATE biweekly_periods SET is_current = FALSE, is_future = FALSE;
  
  -- Set current period
  UPDATE biweekly_periods 
  SET is_current = TRUE 
  WHERE period_start <= CURRENT_DATE 
    AND period_end >= CURRENT_DATE;
  
  -- Set future periods
  UPDATE biweekly_periods 
  SET is_future = TRUE 
  WHERE period_start > CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to get current period
CREATE OR REPLACE FUNCTION get_current_period()
RETURNS TABLE (
  id UUID,
  period_start DATE,
  period_end DATE,
  period_name TEXT,
  year INTEGER,
  month INTEGER,
  period_number INTEGER
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
    bp.period_number
  FROM biweekly_periods bp
  WHERE bp.is_current = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get periods by category
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
    CASE WHEN br.id IS NOT NULL THEN TRUE ELSE FALSE END as has_revenue_data,
    COALESCE(br.status, 'no_data') as revenue_status
  FROM biweekly_periods bp
  LEFT JOIN biweekly_revenue br ON bp.period_start = br.period_start AND bp.period_end = br.period_end
  ORDER BY bp.period_start DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS handle_updated_at_biweekly_periods ON biweekly_periods;
CREATE TRIGGER handle_updated_at_biweekly_periods
  BEFORE UPDATE ON biweekly_periods
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Generate periods for current year and next year
SELECT generate_biweekly_periods_for_year(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
SELECT generate_biweekly_periods_for_year((EXTRACT(YEAR FROM CURRENT_DATE) + 1)::INTEGER);

-- Update status flags
SELECT update_period_status_flags();

-- Add comments for documentation
COMMENT ON TABLE biweekly_periods IS 'Tracks all bi-weekly periods for revenue sharing system';
COMMENT ON COLUMN biweekly_periods.period_start IS 'Start date of the bi-weekly period';
COMMENT ON COLUMN biweekly_periods.period_end IS 'End date of the bi-weekly period';
COMMENT ON COLUMN biweekly_periods.period_name IS 'Human-readable period name';
COMMENT ON COLUMN biweekly_periods.year IS 'Year of the period';
COMMENT ON COLUMN biweekly_periods.month IS 'Month of the period (1-12)';
COMMENT ON COLUMN biweekly_periods.period_number IS 'Period number within the month (1 or 2)';
COMMENT ON COLUMN biweekly_periods.is_current IS 'Whether this is the current active period';
COMMENT ON COLUMN biweekly_periods.is_future IS 'Whether this is a future period';
