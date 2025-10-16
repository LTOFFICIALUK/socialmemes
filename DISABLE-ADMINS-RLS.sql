-- DISABLE RLS ON ADMINS TABLE COMPLETELY
-- This will allow the admin access check to work without any policy restrictions

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "Admins can view admins table" ON admins;
DROP POLICY IF EXISTS "Admins can insert new admins" ON admins;
DROP POLICY IF EXISTS "Admins can update admin records" ON admins;
DROP POLICY IF EXISTS "Admins can delete admin records" ON admins;
DROP POLICY IF EXISTS "Users can view their own admin status" ON admins;
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "allow_own_admin_check" ON admins;
DROP POLICY IF EXISTS "allow_admins_view_all" ON admins;
DROP POLICY IF EXISTS "allow_admins_insert" ON admins;
DROP POLICY IF EXISTS "allow_admins_update" ON admins;

-- Step 2: Disable RLS completely on the admins table
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- Step 3: Verify RLS is disabled (should show rowsecurity = false)
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'admins' AND schemaname = 'public';

-- Step 4: Verify there are no policies left
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE tablename = 'admins';

-- Step 5: Test that you can read the admins table
SELECT * FROM admins WHERE user_id = '12f87e85-9a5a-492c-85e3-13deb815592c';

-- This should now work without any restrictions!
