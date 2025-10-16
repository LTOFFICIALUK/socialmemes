-- Simple fix for RLS policies - only add missing policies
-- This avoids errors if policies already exist

-- Check if system policy exists, if not create it
DO $$
BEGIN
    -- Check if "System can manage all profiles" policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'System can manage all profiles'
    ) THEN
        CREATE POLICY "System can manage all profiles" ON profiles
          FOR ALL USING (true)
          WITH CHECK (true);
    END IF;

    -- Check if "System can view all subscriptions" policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pro_subscriptions' 
        AND policyname = 'System can view all subscriptions'
    ) THEN
        CREATE POLICY "System can view all subscriptions" ON pro_subscriptions
          FOR SELECT USING (true);
    END IF;
END $$;

-- Verify current policies
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
