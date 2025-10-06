-- Alternative fix: Add missing columns to existing referral_payouts table
-- This preserves any existing data

-- Check if referrer_id column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_payouts' AND column_name = 'referrer_id'
    ) THEN
        ALTER TABLE referral_payouts ADD COLUMN referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Check if referred_user_id column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_payouts' AND column_name = 'referred_user_id'
    ) THEN
        ALTER TABLE referral_payouts ADD COLUMN referred_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Check if period_start column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_payouts' AND column_name = 'period_start'
    ) THEN
        ALTER TABLE referral_payouts ADD COLUMN period_start DATE;
    END IF;
END $$;

-- Check if period_end column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_payouts' AND column_name = 'period_end'
    ) THEN
        ALTER TABLE referral_payouts ADD COLUMN period_end DATE;
    END IF;
END $$;

-- Check if referred_user_payout_sol column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_payouts' AND column_name = 'referred_user_payout_sol'
    ) THEN
        ALTER TABLE referral_payouts ADD COLUMN referred_user_payout_sol DECIMAL(20,9) DEFAULT 0;
    END IF;
END $$;

-- Check if referral_bonus_sol column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_payouts' AND column_name = 'referral_bonus_sol'
    ) THEN
        ALTER TABLE referral_payouts ADD COLUMN referral_bonus_sol DECIMAL(20,9) DEFAULT 0;
    END IF;
END $$;

-- Check if payout_status column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_payouts' AND column_name = 'payout_status'
    ) THEN
        ALTER TABLE referral_payouts ADD COLUMN payout_status TEXT CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')) DEFAULT 'pending';
    END IF;
END $$;

-- Check if payment_tx_hash column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_payouts' AND column_name = 'payment_tx_hash'
    ) THEN
        ALTER TABLE referral_payouts ADD COLUMN payment_tx_hash TEXT;
    END IF;
END $$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS referral_payouts_referrer_period_idx ON referral_payouts(referrer_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS referral_payouts_status_idx ON referral_payouts(payout_status);

-- Enable RLS if not already enabled
ALTER TABLE referral_payouts ENABLE ROW LEVEL SECURITY;

-- Add RLS policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'referral_payouts' AND policyname = 'Users can view their own referral payouts'
    ) THEN
        CREATE POLICY "Users can view their own referral payouts" ON referral_payouts
          FOR SELECT USING (auth.uid() = referrer_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'referral_payouts' AND policyname = 'System can manage all referral payouts'
    ) THEN
        CREATE POLICY "System can manage all referral payouts" ON referral_payouts
          FOR ALL WITH CHECK (true);
    END IF;
END $$;

-- Add trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'handle_updated_at_referral_payouts'
    ) THEN
        CREATE TRIGGER handle_updated_at_referral_payouts
          BEFORE UPDATE ON referral_payouts
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;
