-- Fix RLS policy for alpha_chat_members to allow authenticated users to subscribe
-- Drop the old policy
DROP POLICY IF EXISTS "System can insert alpha chat memberships" ON alpha_chat_members;

-- Create new policy that allows authenticated users to insert their own subscriptions
CREATE POLICY "Users can subscribe to alpha chats" ON alpha_chat_members
  FOR INSERT WITH CHECK (auth.uid() = subscriber_id);

