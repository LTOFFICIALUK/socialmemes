-- Test script for admin management functionality
-- Run this after setting up the admin system to verify everything works

-- 1. Check if the admins table exists and has the correct structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'admins' 
ORDER BY ordinal_position;

-- 2. Check if the is_admin function exists
SELECT 
  routine_name, 
  routine_type, 
  data_type
FROM information_schema.routines 
WHERE routine_name = 'is_admin';

-- 3. Test the is_admin function (replace with actual user ID)
-- SELECT is_admin('YOUR_USER_ID_HERE');

-- 4. Check current admin users
SELECT 
  a.id,
  a.user_id,
  a.created_at,
  a.is_active,
  a.permissions,
  p.username,
  p.email
FROM admins a
LEFT JOIN profiles p ON a.user_id = p.id
WHERE a.is_active = true
ORDER BY a.created_at DESC;

-- 5. Check RLS policies on admins table
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
WHERE tablename = 'admins';

-- 6. Test adding a user as admin (replace with actual user ID)
-- INSERT INTO admins (user_id, created_by, is_active, permissions) 
-- VALUES ('USER_ID_TO_ADD', 'YOUR_ADMIN_USER_ID', true, '{"role": "admin"}'::jsonb);

-- 7. Test removing admin access (soft delete)
-- UPDATE admins 
-- SET is_active = false 
-- WHERE user_id = 'USER_ID_TO_REMOVE';

-- 8. Verify the user is no longer an admin
-- SELECT is_admin('USER_ID_TO_REMOVE');

-- 9. Check admin count
SELECT 
  COUNT(*) as total_admins,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_admins,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_admins
FROM admins;
