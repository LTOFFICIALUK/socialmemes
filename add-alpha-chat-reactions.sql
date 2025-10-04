-- Add reaction count columns to alpha_chat_messages table

-- Add columns for each reaction type
ALTER TABLE alpha_chat_messages ADD COLUMN IF NOT EXISTS fire_count INTEGER DEFAULT 0;
ALTER TABLE alpha_chat_messages ADD COLUMN IF NOT EXISTS thumbs_down_count INTEGER DEFAULT 0;
ALTER TABLE alpha_chat_messages ADD COLUMN IF NOT EXISTS diamond_count INTEGER DEFAULT 0;
ALTER TABLE alpha_chat_messages ADD COLUMN IF NOT EXISTS money_count INTEGER DEFAULT 0;

-- Add columns to track which users reacted with each type (JSON arrays of user IDs)
ALTER TABLE alpha_chat_messages ADD COLUMN IF NOT EXISTS fire_reacted_by TEXT[] DEFAULT '{}';
ALTER TABLE alpha_chat_messages ADD COLUMN IF NOT EXISTS thumbs_down_reacted_by TEXT[] DEFAULT '{}';
ALTER TABLE alpha_chat_messages ADD COLUMN IF NOT EXISTS diamond_reacted_by TEXT[] DEFAULT '{}';
ALTER TABLE alpha_chat_messages ADD COLUMN IF NOT EXISTS money_reacted_by TEXT[] DEFAULT '{}';

-- Update existing messages to have 0 counts for all reactions
UPDATE alpha_chat_messages SET 
  fire_count = 0,
  thumbs_down_count = 0,
  diamond_count = 0,
  money_count = 0
WHERE fire_count IS NULL OR thumbs_down_count IS NULL OR diamond_count IS NULL OR money_count IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS alpha_chat_messages_fire_count_idx ON alpha_chat_messages(fire_count);
CREATE INDEX IF NOT EXISTS alpha_chat_messages_thumbs_down_count_idx ON alpha_chat_messages(thumbs_down_count);
CREATE INDEX IF NOT EXISTS alpha_chat_messages_diamond_count_idx ON alpha_chat_messages(diamond_count);
CREATE INDEX IF NOT EXISTS alpha_chat_messages_money_count_idx ON alpha_chat_messages(money_count);

-- Create function to react with fire
CREATE OR REPLACE FUNCTION react_fire_alpha_chat_message(
  p_user_id UUID,
  p_message_id UUID
) RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
  user_reacted BOOLEAN;
BEGIN
  -- Check if user already reacted with fire
  SELECT 
    fire_count,
    p_user_id::TEXT = ANY(fire_reacted_by) INTO current_count, user_reacted
  FROM alpha_chat_messages 
  WHERE id = p_message_id;
  
  -- If user already reacted, remove the reaction
  IF user_reacted THEN
    UPDATE alpha_chat_messages 
    SET 
      fire_reacted_by = array_remove(fire_reacted_by, p_user_id::TEXT),
      fire_count = fire_count - 1
    WHERE id = p_message_id;
    
    SELECT fire_count INTO current_count FROM alpha_chat_messages WHERE id = p_message_id;
    RETURN current_count;
  ELSE
    -- Add user to fire_reacted_by array and increment fire_count
    UPDATE alpha_chat_messages 
    SET 
      fire_reacted_by = array_append(fire_reacted_by, p_user_id::TEXT),
      fire_count = fire_count + 1
    WHERE id = p_message_id;
    
    SELECT fire_count INTO current_count FROM alpha_chat_messages WHERE id = p_message_id;
    RETURN current_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to react with thumbs down
CREATE OR REPLACE FUNCTION react_thumbs_down_alpha_chat_message(
  p_user_id UUID,
  p_message_id UUID
) RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
  user_reacted BOOLEAN;
BEGIN
  -- Check if user already reacted with thumbs down
  SELECT 
    thumbs_down_count,
    p_user_id::TEXT = ANY(thumbs_down_reacted_by) INTO current_count, user_reacted
  FROM alpha_chat_messages 
  WHERE id = p_message_id;
  
  -- If user already reacted, remove the reaction
  IF user_reacted THEN
    UPDATE alpha_chat_messages 
    SET 
      thumbs_down_reacted_by = array_remove(thumbs_down_reacted_by, p_user_id::TEXT),
      thumbs_down_count = thumbs_down_count - 1
    WHERE id = p_message_id;
    
    SELECT thumbs_down_count INTO current_count FROM alpha_chat_messages WHERE id = p_message_id;
    RETURN current_count;
  ELSE
    -- Add user to thumbs_down_reacted_by array and increment thumbs_down_count
    UPDATE alpha_chat_messages 
    SET 
      thumbs_down_reacted_by = array_append(thumbs_down_reacted_by, p_user_id::TEXT),
      thumbs_down_count = thumbs_down_count + 1
    WHERE id = p_message_id;
    
    SELECT thumbs_down_count INTO current_count FROM alpha_chat_messages WHERE id = p_message_id;
    RETURN current_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to react with diamond
CREATE OR REPLACE FUNCTION react_diamond_alpha_chat_message(
  p_user_id UUID,
  p_message_id UUID
) RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
  user_reacted BOOLEAN;
BEGIN
  -- Check if user already reacted with diamond
  SELECT 
    diamond_count,
    p_user_id::TEXT = ANY(diamond_reacted_by) INTO current_count, user_reacted
  FROM alpha_chat_messages 
  WHERE id = p_message_id;
  
  -- If user already reacted, remove the reaction
  IF user_reacted THEN
    UPDATE alpha_chat_messages 
    SET 
      diamond_reacted_by = array_remove(diamond_reacted_by, p_user_id::TEXT),
      diamond_count = diamond_count - 1
    WHERE id = p_message_id;
    
    SELECT diamond_count INTO current_count FROM alpha_chat_messages WHERE id = p_message_id;
    RETURN current_count;
  ELSE
    -- Add user to diamond_reacted_by array and increment diamond_count
    UPDATE alpha_chat_messages 
    SET 
      diamond_reacted_by = array_append(diamond_reacted_by, p_user_id::TEXT),
      diamond_count = diamond_count + 1
    WHERE id = p_message_id;
    
    SELECT diamond_count INTO current_count FROM alpha_chat_messages WHERE id = p_message_id;
    RETURN current_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to react with money
CREATE OR REPLACE FUNCTION react_money_alpha_chat_message(
  p_user_id UUID,
  p_message_id UUID
) RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
  user_reacted BOOLEAN;
BEGIN
  -- Check if user already reacted with money
  SELECT 
    money_count,
    p_user_id::TEXT = ANY(money_reacted_by) INTO current_count, user_reacted
  FROM alpha_chat_messages 
  WHERE id = p_message_id;
  
  -- If user already reacted, remove the reaction
  IF user_reacted THEN
    UPDATE alpha_chat_messages 
    SET 
      money_reacted_by = array_remove(money_reacted_by, p_user_id::TEXT),
      money_count = money_count - 1
    WHERE id = p_message_id;
    
    SELECT money_count INTO current_count FROM alpha_chat_messages WHERE id = p_message_id;
    RETURN current_count;
  ELSE
    -- Add user to money_reacted_by array and increment money_count
    UPDATE alpha_chat_messages 
    SET 
      money_reacted_by = array_append(money_reacted_by, p_user_id::TEXT),
      money_count = money_count + 1
    WHERE id = p_message_id;
    
    SELECT money_count INTO current_count FROM alpha_chat_messages WHERE id = p_message_id;
    RETURN current_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION react_fire_alpha_chat_message(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION react_thumbs_down_alpha_chat_message(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION react_diamond_alpha_chat_message(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION react_money_alpha_chat_message(UUID, UUID) TO authenticated;
