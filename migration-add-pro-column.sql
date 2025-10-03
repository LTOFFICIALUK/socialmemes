-- Add pro column to profiles table
ALTER TABLE profiles ADD COLUMN pro BOOLEAN DEFAULT FALSE;

-- Add index for pro column for better query performance
CREATE INDEX profiles_pro_idx ON profiles(pro) WHERE pro = TRUE;

-- Create pro_subscriptions table to track subscription history
CREATE TABLE pro_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  duration_months INTEGER NOT NULL,
  price_sol DECIMAL(20,9) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  payment_tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for pro_subscriptions
CREATE INDEX pro_subscriptions_user_id_idx ON pro_subscriptions(user_id);
CREATE INDEX pro_subscriptions_status_idx ON pro_subscriptions(status);
CREATE INDEX pro_subscriptions_created_at_idx ON pro_subscriptions(created_at DESC);

-- Enable RLS for pro_subscriptions
ALTER TABLE pro_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for pro_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON pro_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert subscriptions" ON pro_subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update subscriptions" ON pro_subscriptions
  FOR UPDATE WITH CHECK (true);

-- Update the handle_new_user function to include pro column
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, banner_url, pro)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'banner_url',
    FALSE -- Default to non-pro user
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
