-- Migration to add parent_reply_id column for endless threading support
-- Run this in your Supabase SQL editor

-- Add parent_reply_id column to replies table
ALTER TABLE replies 
ADD COLUMN parent_reply_id UUID REFERENCES replies(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX replies_parent_reply_id_idx ON replies(parent_reply_id);

-- Update likes table to support liking replies
ALTER TABLE likes 
ADD COLUMN reply_id UUID REFERENCES replies(id) ON DELETE CASCADE;

-- Add constraint to ensure either post_id or reply_id is provided, but not both
ALTER TABLE likes 
ADD CONSTRAINT likes_post_or_reply CHECK (
  (post_id IS NOT NULL AND reply_id IS NULL) OR 
  (post_id IS NULL AND reply_id IS NOT NULL)
);

-- Drop the old unique constraint
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_user_id_post_id_key;

-- Add new unique constraints
CREATE UNIQUE INDEX likes_user_post_unique ON likes(user_id, post_id) WHERE post_id IS NOT NULL;
CREATE UNIQUE INDEX likes_user_reply_unique ON likes(user_id, reply_id) WHERE reply_id IS NOT NULL;

-- Update the comment notification function to handle threaded replies
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  parent_reply_owner_id UUID;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  -- If this is a reply to a reply, get the parent reply owner
  IF NEW.parent_reply_id IS NOT NULL THEN
    SELECT user_id INTO parent_reply_owner_id FROM replies WHERE id = NEW.parent_reply_id;
  END IF;
  
  -- Create notification for post owner (if not replying to own post)
  IF NEW.user_id != post_owner_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, post_id, reply_id)
    VALUES (post_owner_id, 'comment', NEW.user_id, NEW.post_id, NEW.id);
  END IF;
  
  -- Create notification for parent reply owner (if replying to someone else's reply)
  IF NEW.parent_reply_id IS NOT NULL AND NEW.user_id != parent_reply_owner_id AND parent_reply_owner_id != post_owner_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, post_id, reply_id)
    VALUES (parent_reply_owner_id, 'comment', NEW.user_id, NEW.post_id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
