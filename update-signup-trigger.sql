-- Update the handle_new_user trigger to handle the new referral tables

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
  
  -- If user was referred, create referral record and update referrer's stats
  IF referred_by_value IS NOT NULL THEN
    -- Insert referral record
    INSERT INTO referrals (referrer_id, referred_user_id)
    VALUES (referred_by_value, NEW.id);
    
    -- Update or insert referral_data for the referrer
    INSERT INTO referral_data (user_id, total_referrals, total_earned, pending_payout, last_updated)
    VALUES (referred_by_value, 1, 0.00, 0.00, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_referrals = referral_data.total_referrals + 1,
      last_updated = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
