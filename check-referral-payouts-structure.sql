-- Diagnostic script to check the current structure of referral_payouts table
-- Run this to see what columns actually exist

-- Check if the table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'referral_payouts'
) as table_exists;

-- If table exists, show its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'referral_payouts'
ORDER BY ordinal_position;

-- Check for any existing data
SELECT COUNT(*) as row_count FROM referral_payouts;
