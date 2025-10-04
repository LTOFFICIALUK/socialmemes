-- Add simple likes system to alpha_chat_messages table

-- Add likes_count column to alpha_chat_messages table
ALTER TABLE alpha_chat_messages ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Add liked_by column to track which users liked each message (JSON array of user IDs)
ALTER TABLE alpha_chat_messages ADD COLUMN IF NOT EXISTS liked_by TEXT[] DEFAULT '{}';

-- Update existing messages to have 0 likes
UPDATE alpha_chat_messages SET likes_count = 0 WHERE likes_count IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS alpha_chat_messages_likes_count_idx ON alpha_chat_messages(likes_count);

-- Create function to like an alpha chat message
CREATE OR REPLACE FUNCTION like_alpha_chat_message(
  p_user_id UUID,
  p_message_id UUID
) RETURNS INTEGER AS $$
DECLARE
  current_likes INTEGER;
  user_liked BOOLEAN;
BEGIN
  -- Check if user already liked this message
  SELECT 
    likes_count,
    p_user_id::TEXT = ANY(liked_by) INTO current_likes, user_liked
  FROM alpha_chat_messages 
  WHERE id = p_message_id;
  
  -- If user already liked, return current count
  IF user_liked THEN
    RETURN current_likes;
  END IF;
  
  -- Add user to liked_by array and increment likes_count
  UPDATE alpha_chat_messages 
  SET 
    liked_by = array_append(liked_by, p_user_id::TEXT),
    likes_count = likes_count + 1
  WHERE id = p_message_id;
  
  -- Return new count
  SELECT likes_count INTO current_likes FROM alpha_chat_messages WHERE id = p_message_id;
  RETURN current_likes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to unlike an alpha chat message
CREATE OR REPLACE FUNCTION unlike_alpha_chat_message(
  p_user_id UUID,
  p_message_id UUID
) RETURNS INTEGER AS $$
DECLARE
  current_likes INTEGER;
  user_liked BOOLEAN;
BEGIN
  -- Check if user liked this message
  SELECT 
    likes_count,
    p_user_id::TEXT = ANY(liked_by) INTO current_likes, user_liked
  FROM alpha_chat_messages 
  WHERE id = p_message_id;
  
  -- If user didn't like, return current count
  IF NOT user_liked THEN
    RETURN current_likes;
  END IF;
  
  -- Remove user from liked_by array and decrement likes_count
  UPDATE alpha_chat_messages 
  SET 
    liked_by = array_remove(liked_by, p_user_id::TEXT),
    likes_count = likes_count - 1
  WHERE id = p_message_id;
  
  -- Return new count
  SELECT likes_count INTO current_likes FROM alpha_chat_messages WHERE id = p_message_id;
  RETURN current_likes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION like_alpha_chat_message(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unlike_alpha_chat_message(UUID, UUID) TO authenticated;
