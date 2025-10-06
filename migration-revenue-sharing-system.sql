-- Migration: Revenue Sharing System
-- Run this migration to implement the bi-weekly revenue sharing system

-- Create bi-weekly revenue tracking table
CREATE TABLE IF NOT EXISTS biweekly_revenue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  pumpfun_fees_sol DECIMAL(20,9) DEFAULT 0,
  platform_revenue_sol DECIMAL(20,9) DEFAULT 0,
  pumpfun_pool_sol DECIMAL(20,9) DEFAULT 0, -- 40% of PumpFun fees
  platform_pool_sol DECIMAL(20,9) DEFAULT 0, -- 50% of platform revenue
  total_pool_sol DECIMAL(20,9) DEFAULT 0,
  referral_bonus_pool_sol DECIMAL(20,9) DEFAULT 0, -- 5% of referral earnings
  status TEXT CHECK (status IN ('pending', 'calculated', 'paid')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(period_start, period_end)
);

-- Create user interaction scores table for bi-weekly periods
CREATE TABLE IF NOT EXISTS user_interaction_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  posts_created INTEGER DEFAULT 0,
  comments_replies_created INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  follows_received INTEGER DEFAULT 0,
  total_score DECIMAL(20,9) DEFAULT 0,
  is_pro_eligible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period_start, period_end)
);

-- Create user payouts table
CREATE TABLE IF NOT EXISTS user_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  pumpfun_share_sol DECIMAL(20,9) DEFAULT 0,
  platform_share_sol DECIMAL(20,9) DEFAULT 0,
  total_payout_sol DECIMAL(20,9) DEFAULT 0,
  referral_bonus_sol DECIMAL(20,9) DEFAULT 0,
  final_payout_sol DECIMAL(20,9) DEFAULT 0,
  payout_status TEXT CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')) DEFAULT 'pending',
  payment_tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral payouts table
CREATE TABLE IF NOT EXISTS referral_payouts (
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

-- Add indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS biweekly_revenue_period_idx ON biweekly_revenue(period_start, period_end);
CREATE INDEX IF NOT EXISTS user_interaction_scores_user_period_idx ON user_interaction_scores(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS user_interaction_scores_pro_eligible_idx ON user_interaction_scores(is_pro_eligible) WHERE is_pro_eligible = TRUE;
CREATE INDEX IF NOT EXISTS user_payouts_user_period_idx ON user_payouts(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS user_payouts_status_idx ON user_payouts(payout_status);
CREATE INDEX IF NOT EXISTS referral_payouts_referrer_period_idx ON referral_payouts(referrer_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS referral_payouts_status_idx ON referral_payouts(payout_status);

-- Enable RLS
ALTER TABLE biweekly_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interaction_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (only create if they don't exist)
DROP POLICY IF EXISTS "Users can view their own interaction scores" ON user_interaction_scores;
CREATE POLICY "Users can view their own interaction scores" ON user_interaction_scores
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own payouts" ON user_payouts;
CREATE POLICY "Users can view their own payouts" ON user_payouts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own referral payouts" ON referral_payouts;
CREATE POLICY "Users can view their own referral payouts" ON referral_payouts
  FOR SELECT USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "System can manage all revenue data" ON biweekly_revenue;
CREATE POLICY "System can manage all revenue data" ON biweekly_revenue
  FOR ALL WITH CHECK (true);

DROP POLICY IF EXISTS "System can manage all interaction scores" ON user_interaction_scores;
CREATE POLICY "System can manage all interaction scores" ON user_interaction_scores
  FOR ALL WITH CHECK (true);

DROP POLICY IF EXISTS "System can manage all payouts" ON user_payouts;
CREATE POLICY "System can manage all payouts" ON user_payouts
  FOR ALL WITH CHECK (true);

DROP POLICY IF EXISTS "System can manage all referral payouts" ON referral_payouts;
CREATE POLICY "System can manage all referral payouts" ON referral_payouts
  FOR ALL WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at (only create if they don't exist)
DROP TRIGGER IF EXISTS handle_updated_at_biweekly_revenue ON biweekly_revenue;
CREATE TRIGGER handle_updated_at_biweekly_revenue
  BEFORE UPDATE ON biweekly_revenue
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_user_interaction_scores ON user_interaction_scores;
CREATE TRIGGER handle_updated_at_user_interaction_scores
  BEFORE UPDATE ON user_interaction_scores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_user_payouts ON user_payouts;
CREATE TRIGGER handle_updated_at_user_payouts
  BEFORE UPDATE ON user_payouts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_referral_payouts ON referral_payouts;
CREATE TRIGGER handle_updated_at_referral_payouts
  BEFORE UPDATE ON referral_payouts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
