-- Migration: Add referral system to profiles table
-- This migration adds referral_code, referral_link, and referred_by columns to the profiles table

-- Add referral columns to profiles table
ALTER TABLE profiles 
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN referral_link TEXT,
ADD COLUMN referred_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for referral_code for faster lookups
CREATE INDEX profiles_referral_code_idx ON profiles(referral_code);

-- Create index for referred_by for faster queries
CREATE INDEX profiles_referred_by_idx ON profiles(referred_by);

-- Function to generate a referral code based on username
CREATE OR REPLACE FUNCTION generate_referral_code(username_input TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Use the username as the referral code (uppercase for consistency)
  RETURN upper(trim(username_input));
END;
$$ LANGUAGE plpgsql;

-- Function to generate referral link
CREATE OR REPLACE FUNCTION generate_referral_link(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT referral_link FROM profiles WHERE id = user_id),
    CONCAT(COALESCE(current_setting('app.settings.site_url', true), 'https://socialmemes.app'), '/auth/signup?ref=', 
           (SELECT referral_code FROM profiles WHERE id = user_id))
  );
END;
$$ LANGUAGE plpgsql;

-- Function to handle referral code lookup and validation
CREATE OR REPLACE FUNCTION get_referrer_by_code(referral_code_input TEXT)
RETURNS UUID AS $$
DECLARE
  referrer_id UUID;
BEGIN
  -- Look up the referrer by their referral code
  SELECT id INTO referrer_id 
  FROM profiles 
  WHERE referral_code = upper(trim(referral_code_input));
  
  RETURN referrer_id;
END;
$$ LANGUAGE plpgsql;

-- Update the handle_new_user function to include referral logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_value TEXT;
  referral_code_value TEXT;
  referral_link_value TEXT;
  referred_by_value UUID;
BEGIN
  -- Get the username
  username_value := COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8));
  
  -- Generate referral code based on username
  referral_code_value := generate_referral_code(username_value);
  
  -- Generate referral link
  referral_link_value := CONCAT(
    COALESCE(current_setting('app.settings.site_url', true), 'https://socialmemes.app'), 
    '/auth/signup?ref=', 
    referral_code_value
  );
  
  -- Check if user was referred by someone
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    referred_by_value := get_referrer_by_code(NEW.raw_user_meta_data->>'referral_code');
  END IF;
  
  INSERT INTO public.profiles (
    id, 
    username, 
    full_name, 
    avatar_url, 
    banner_url,
    referral_code,
    referral_link,
    referred_by
  )
  VALUES (
    NEW.id,
    username_value,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'banner_url',
    referral_code_value,
    referral_link_value,
    referred_by_value
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get referral statistics for a user
CREATE OR REPLACE FUNCTION get_referral_stats(user_id UUID)
RETURNS TABLE (
  total_referrals BIGINT,
  recent_referrals BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_referrals,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as recent_referrals
  FROM profiles 
  WHERE referred_by = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get list of referrals for a user
CREATE OR REPLACE FUNCTION get_user_referrals(user_id UUID, limit_count INTEGER DEFAULT 50, offset_count INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.created_at
  FROM profiles p
  WHERE p.referred_by = user_id
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing profiles to have referral codes and links
UPDATE profiles 
SET 
  referral_code = generate_referral_code(username),
  referral_link = CONCAT(
    COALESCE(current_setting('app.settings.site_url', true), 'https://socialmemes.app'), 
    '/auth/signup?ref=', 
    generate_referral_code(username)
  )
WHERE referral_code IS NULL;

-- Add RLS policies for referral data
CREATE POLICY "Users can view their own referral data" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view referral codes of other users" ON profiles
  FOR SELECT USING (true);

-- Add comments for documentation
COMMENT ON COLUMN profiles.referral_code IS 'Username-based referral code (uppercase)';
COMMENT ON COLUMN profiles.referral_link IS 'Full URL for sharing referrals';
COMMENT ON COLUMN profiles.referred_by IS 'UUID of the user who referred this user';
