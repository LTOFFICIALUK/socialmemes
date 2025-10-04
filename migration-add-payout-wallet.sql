-- Add payout wallet address field to profiles table for alpha chat creators
-- This allows alpha chat creators to specify where they want to receive subscription payments

-- Add payout_wallet_address column to profiles table
ALTER TABLE profiles ADD COLUMN payout_wallet_address TEXT;

-- Add index for better performance when querying by payout wallet
CREATE INDEX profiles_payout_wallet_address_idx ON profiles(payout_wallet_address) WHERE payout_wallet_address IS NOT NULL;

-- Add comment to document the field
COMMENT ON COLUMN profiles.payout_wallet_address IS 'Solana wallet address where alpha chat creators receive subscription payments';
