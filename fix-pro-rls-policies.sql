-- Fix RLS policies for Pro subscription functionality

-- First, let's check if we need to add a policy for system/API updates to profiles
-- The existing policy "Users can update their own profile" should work, but let's add a system policy

-- Add policy for system to update profiles (for Pro subscription activation)
CREATE POLICY "System can update profiles for Pro subscription" ON profiles
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Make sure pro_subscriptions table has proper RLS policies
-- (These should already exist from the migration, but let's ensure they're correct)

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON pro_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert subscriptions (for API)
CREATE POLICY "System can insert subscriptions" ON pro_subscriptions
  FOR INSERT WITH CHECK (true);

-- System can update subscriptions (for API)
CREATE POLICY "System can update subscriptions" ON pro_subscriptions
  FOR UPDATE WITH CHECK (true);

-- If the above policies already exist, you might get errors - that's okay, just ignore them
