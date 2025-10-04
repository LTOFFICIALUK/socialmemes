-- Add support for liking alpha chat messages

-- Add alpha_chat_message_id column to likes table
ALTER TABLE likes ADD COLUMN alpha_chat_message_id UUID REFERENCES alpha_chat_messages(id) ON DELETE CASCADE;

-- Drop the old constraint
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_post_or_reply;

-- Create new constraint that allows posts, replies, OR alpha chat messages
ALTER TABLE likes ADD CONSTRAINT likes_post_reply_or_alpha_chat CHECK (
  (post_id IS NOT NULL AND reply_id IS NULL AND alpha_chat_message_id IS NULL) OR 
  (post_id IS NULL AND reply_id IS NOT NULL AND alpha_chat_message_id IS NULL) OR
  (post_id IS NULL AND reply_id IS NULL AND alpha_chat_message_id IS NOT NULL)
);

-- Add index for alpha chat message likes
CREATE INDEX likes_alpha_chat_message_id_idx ON likes(alpha_chat_message_id);

-- Add unique constraint for alpha chat message likes
CREATE UNIQUE INDEX likes_user_alpha_chat_message_unique ON likes(user_id, alpha_chat_message_id) WHERE alpha_chat_message_id IS NOT NULL;

-- Update RLS policies for likes table to allow alpha chat message likes
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all likes" ON likes;
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;

-- Create new policies that include alpha chat message likes
CREATE POLICY "Users can view all likes" ON likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);
