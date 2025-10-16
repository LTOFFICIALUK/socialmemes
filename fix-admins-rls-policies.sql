-- Fix RLS policies on admins table to allow users to check their own admin status
-- This is critical for the admin access check to work

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view admins table" ON admins;
DROP POLICY IF EXISTS "Admins can insert new admins" ON admins;
DROP POLICY IF EXISTS "Admins can update admin records" ON admins;
DROP POLICY IF EXISTS "Admins can delete admin records" ON admins;

-- Create new policies that allow users to check their own admin status
-- Policy 1: Users can read their own admin record (critical for access check)
CREATE POLICY "Users can view their own admin status" ON admins
  FOR SELECT USING (user_id = auth.uid());

-- Policy 2: Admins can view all admin records
CREATE POLICY "Admins can view all admins" ON admins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Policy 3: Only admins can insert new admins
CREATE POLICY "Admins can insert new admins" ON admins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Policy 4: Only admins can update admin records
CREATE POLICY "Admins can update admin records" ON admins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Policy 5: Only admins can delete admin records (soft delete via is_active=false)
CREATE POLICY "Admins can delete admin records" ON admins
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'admins'
ORDER BY policyname;
