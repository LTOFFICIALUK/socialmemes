-- Test script for the referral system
-- This script tests the referral functionality

-- Test 1: Check if referral columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('referral_code', 'referral_link', 'referred_by');

-- Test 2: Check if referral functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('generate_referral_code', 'get_referrer_by_code', 'get_referral_stats', 'get_user_referrals');

-- Test 3: Test referral code generation
SELECT generate_referral_code('testuser') as test_code;

-- Test 4: Check if existing users have referral codes (after migration)
SELECT id, username, referral_code, referral_link, referred_by 
FROM profiles 
LIMIT 5;

-- Test 5: Test referral link generation
SELECT generate_referral_link(id) as referral_link 
FROM profiles 
LIMIT 1;

-- Test 6: Test referral stats function (replace with actual user ID)
-- SELECT * FROM get_referral_stats('your-user-id-here');

-- Test 7: Test user referrals function (replace with actual user ID)
-- SELECT * FROM get_user_referrals('your-user-id-here', 10, 0);

-- Test 8: Check if RLS policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname LIKE '%referral%';
