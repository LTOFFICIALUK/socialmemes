-- URGENT FIX: Admin Access Issue
-- Run this entire script in your Supabase SQL Editor

-- Step 1: Verify your admin record exists
SELECT 
  id,
  user_id,
  is_active,
  created_at
FROM admins 
WHERE user_id = '12f87e85-9a5a-492c-85e3-13deb815592c';

-- Step 2: Drop ALL existing RLS policies on admins table
DROP POLICY IF EXISTS "Admins can view admins table" ON admins;
DROP POLICY IF EXISTS "Admins can insert new admins" ON admins;
DROP POLICY IF EXISTS "Admins can update admin records" ON admins;
DROP POLICY IF EXISTS "Admins can delete admin records" ON admins;
DROP POLICY IF EXISTS "Users can view their own admin status" ON admins;
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;

-- Step 3: Create the correct policy that allows users to check their own admin status
-- This is the KEY policy that was missing!
CREATE POLICY "allow_own_admin_check" ON admins
  FOR SELECT 
  USING (user_id = auth.uid());

-- Step 4: Allow admins to view all admins (for admin management UI)
CREATE POLICY "allow_admins_view_all" ON admins
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid() 
      AND a.is_active = true
    )
  );

-- Step 5: Allow admins to insert new admins
CREATE POLICY "allow_admins_insert" ON admins
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid() 
      AND a.is_active = true
    )
  );

-- Step 6: Allow admins to update admin records
CREATE POLICY "allow_admins_update" ON admins
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid() 
      AND a.is_active = true
    )
  );

-- Step 7: Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'admins'
ORDER BY policyname;

-- Step 8: Test that you can read your own admin record
-- This should return your admin record
SELECT * FROM admins WHERE user_id = auth.uid();

-- Step 9: Verify RLS is enabled (should be true)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'admins' AND schemaname = 'public';
