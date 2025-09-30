-- Migration: Add promotion columns to posts table
-- Run this in your Supabase SQL editor

-- Add promotion columns to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_promoted BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS promotion_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS promotion_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS promotion_price DECIMAL(20,9);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS payment_tx_hash TEXT;

-- Add index for promoted posts queries
CREATE INDEX IF NOT EXISTS posts_promotion_idx ON posts(is_promoted, promotion_end) WHERE is_promoted = TRUE;

-- Add comment to document the new columns
COMMENT ON COLUMN posts.is_promoted IS 'Whether this post is currently promoted';
COMMENT ON COLUMN posts.promotion_start IS 'When the promotion started';
COMMENT ON COLUMN posts.promotion_end IS 'When the promotion ends';
COMMENT ON COLUMN posts.promotion_price IS 'SOL amount paid for promotion';
COMMENT ON COLUMN posts.payment_tx_hash IS 'Solana transaction hash for the payment';
