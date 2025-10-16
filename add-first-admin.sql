-- Script to add the first admin user
-- Replace 'YOUR_USER_ID_HERE' with the actual user ID from auth.users table

-- First, let's see what users exist in the system
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- To add a specific user as admin, uncomment and modify the line below:
-- INSERT INTO admins (user_id, created_by, is_active, permissions) 
-- VALUES ('YOUR_USER_ID_HERE', 'YOUR_USER_ID_HERE', true, '{"role": "super_admin"}'::jsonb);

-- To add the first user (oldest user) as admin automatically:
-- INSERT INTO admins (user_id, created_by, is_active, permissions)
-- SELECT 
--   id as user_id,
--   id as created_by,
--   true as is_active,
--   '{"role": "super_admin"}'::jsonb as permissions
-- FROM auth.users 
-- ORDER BY created_at ASC 
-- LIMIT 1;

-- To check if the admin was added successfully:
-- SELECT a.*, p.username, p.email 
-- FROM admins a
-- LEFT JOIN profiles p ON a.user_id = p.id
-- WHERE a.is_active = true;

-- To test the admin function:
-- SELECT is_admin('YOUR_USER_ID_HERE');
