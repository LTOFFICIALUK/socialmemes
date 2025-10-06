-- Migration: Add 'claimed' as a valid payout_status
-- This adds 'claimed' to the CHECK constraints for payout_status columns
-- Run this in your Supabase SQL editor

-- Update user_payouts table to include 'claimed' status
ALTER TABLE user_payouts 
DROP CONSTRAINT IF EXISTS user_payouts_payout_status_check;

ALTER TABLE user_payouts 
ADD CONSTRAINT user_payouts_payout_status_check 
CHECK (payout_status IN ('pending', 'processing', 'paid', 'claimed', 'failed'));

-- Update referral_payouts table to include 'claimed' status
ALTER TABLE referral_payouts 
DROP CONSTRAINT IF EXISTS referral_payouts_payout_status_check;

ALTER TABLE referral_payouts 
ADD CONSTRAINT referral_payouts_payout_status_check 
CHECK (payout_status IN ('pending', 'processing', 'paid', 'claimed', 'failed'));

-- Verify the constraints
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name IN ('user_payouts', 'referral_payouts')
    AND tc.constraint_type = 'CHECK';

