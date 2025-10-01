-- Migration to fix like notifications for replies
-- Run this in your Supabase SQL editor

-- Update the like notification function to handle both post and reply likes
CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  reply_owner_id UUID;
BEGIN
  -- Handle post likes
  IF NEW.post_id IS NOT NULL THEN
    -- Get the post owner
    SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
    
    -- Don't create notification if user is liking their own post
    IF NEW.user_id != post_owner_id THEN
      INSERT INTO public.notifications (user_id, type, actor_id, post_id)
      VALUES (post_owner_id, 'like', NEW.user_id, NEW.post_id);
    END IF;
  END IF;
  
  -- Handle reply likes
  IF NEW.reply_id IS NOT NULL THEN
    -- Get the reply owner
    SELECT user_id INTO reply_owner_id FROM replies WHERE id = NEW.reply_id;
    
    -- Don't create notification if user is liking their own reply
    IF NEW.user_id != reply_owner_id THEN
      INSERT INTO public.notifications (user_id, type, actor_id, reply_id)
      VALUES (reply_owner_id, 'like', NEW.user_id, NEW.reply_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
