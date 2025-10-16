-- Fix RLS policies for admin operations on profiles table
-- This allows the admin API to search and update profiles using service role key

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "System can update profiles for Pro subscription" ON profiles;

-- Recreate the user update policy
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add system policy for admin operations (service role)
CREATE POLICY "System can manage all profiles" ON profiles
  FOR ALL USING (true)
  WITH CHECK (true);

-- Also ensure the pro_subscriptions table has proper system access
DROP POLICY IF EXISTS "System can insert subscriptions" ON pro_subscriptions;
DROP POLICY IF EXISTS "System can update subscriptions" ON pro_subscriptions;

-- Recreate system policies for pro_subscriptions
CREATE POLICY "System can insert subscriptions" ON pro_subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update subscriptions" ON pro_subscriptions
  FOR UPDATE WITH CHECK (true);

-- Users can still view their own subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON pro_subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON pro_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Add system select policy for admin operations
CREATE POLICY "System can view all subscriptions" ON pro_subscriptions
  FOR SELECT USING (true);

-- Verify the policies are working
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'pro_subscriptions')
ORDER BY tablename, policyname;
