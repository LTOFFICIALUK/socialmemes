-- Test script to make a user pro for testing discount functionality
-- Replace the user ID with the actual user you want to test with

-- Make the first user (CD2025CD) pro for testing
UPDATE profiles 
SET pro = true 
WHERE id = '01d24e07-6aae-4a73-ada0-d0173b0d4c8d';

-- Verify the update
SELECT id, username, pro FROM profiles WHERE id = '01d24e07-6aae-4a73-ada0-d0173b0d4c8d';
