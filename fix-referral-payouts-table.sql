-- Fix script for referral_payouts table structure
-- This will drop and recreate the table with the correct structure

-- Drop the table if it exists (this will lose any existing data)
DROP TABLE IF EXISTS referral_payouts CASCADE;

-- Recreate the table with the correct structure
CREATE TABLE referral_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  referred_user_payout_sol DECIMAL(20,9) DEFAULT 0,
  referral_bonus_sol DECIMAL(20,9) DEFAULT 0, -- 5% of referred user's payout
  payout_status TEXT CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')) DEFAULT 'pending',
  payment_tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS referral_payouts_referrer_period_idx ON referral_payouts(referrer_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS referral_payouts_status_idx ON referral_payouts(payout_status);

-- Enable RLS
ALTER TABLE referral_payouts ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DROP POLICY IF EXISTS "Users can view their own referral payouts" ON referral_payouts;
CREATE POLICY "Users can view their own referral payouts" ON referral_payouts
  FOR SELECT USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "System can manage all referral payouts" ON referral_payouts;
CREATE POLICY "System can manage all referral payouts" ON referral_payouts
  FOR ALL WITH CHECK (true);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at_referral_payouts ON referral_payouts;
CREATE TRIGGER handle_updated_at_referral_payouts
  BEFORE UPDATE ON referral_payouts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
