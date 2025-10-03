-- Update referral link generation to use cleaner format: https://socialmemes.fun/ref=CODE

-- Update the generate_referral_link function
CREATE OR REPLACE FUNCTION generate_referral_link(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT referral_link FROM profiles WHERE id = user_id),
    CONCAT(COALESCE(current_setting('app.settings.site_url', true), 'https://socialmemes.fun'), '/ref=', 
           (SELECT referral_code FROM profiles WHERE id = user_id))
  );
END;
$$ LANGUAGE plpgsql;

-- Update the handle_new_user function to use the new link format
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

-- Update existing referral links to use the new format
UPDATE profiles 
SET referral_link = CONCAT(
  COALESCE(current_setting('app.settings.site_url', true), 'https://socialmemes.fun'), 
  '/ref=', 
  referral_code
)
WHERE referral_code IS NOT NULL;
