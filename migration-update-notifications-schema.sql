-- Migration: Update notifications table to support payout notifications
-- Run this in your Supabase SQL editor

-- Add new columns for payout notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Drop the existing type constraint
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the new type constraint that includes payout_available and alpha_chat_subscription
ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('follow', 'like', 'comment', 'payout_available', 'alpha_chat_subscription'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS notifications_metadata_idx ON notifications USING GIN (metadata);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications (type);
CREATE INDEX IF NOT EXISTS notifications_user_type_idx ON notifications (user_id, type);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at_notifications ON notifications;
CREATE TRIGGER handle_updated_at_notifications
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
