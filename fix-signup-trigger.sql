-- Fix the handle_new_user trigger to remove references to non-existent tables
-- This fixes the "Database error saving new user" issue when signing up with referral codes

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
  
  -- Generate referral link with cleaner format
  referral_link_value := CONCAT(
    COALESCE(current_setting('app.settings.site_url', true), 'https://socialmemes.fun'), 
    '/ref=', 
    referral_code_value
  );
  
  -- Check if user was referred by someone
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    referred_by_value := get_referrer_by_code(NEW.raw_user_meta_data->>'referral_code');
  END IF;
  
  -- Insert profile
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
  
  -- Note: Referral tracking is handled through the referred_by column in profiles table
  -- Additional referral analytics can be implemented through views or functions as needed
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
