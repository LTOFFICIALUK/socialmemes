-- Automatic user unflagging after 24 hours
-- This system automatically reverts flagged users back to active status after 24 hours

-- Step 1: Create a function to automatically unflag users after 24 hours
CREATE OR REPLACE FUNCTION unflag_expired_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update profiles that have been flagged for more than 24 hours
  UPDATE public.profiles
  SET 
    moderation_status = 'active',
    moderation_reason = NULL,
    moderated_by = NULL,
    moderated_at = NULL
  WHERE 
    moderation_status = 'flagged'
    AND moderated_at IS NOT NULL
    AND moderated_at < (NOW() - INTERVAL '24 hours');

  -- Log how many users were unflagged
  RAISE NOTICE 'Unflagged users after 24 hours: %', (
    SELECT COUNT(*) 
    FROM public.profiles 
    WHERE moderation_status = 'flagged'
    AND moderated_at IS NOT NULL
    AND moderated_at < (NOW() - INTERVAL '24 hours')
  );
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION unflag_expired_users() IS 
'Automatically reverts flagged users back to active status after 24 hours. Should be called by pg_cron or similar scheduler.';

-- Step 2: Enable the pg_cron extension (if not already enabled)
-- Note: This requires superuser privileges and may need to be done through Supabase dashboard
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 3: Schedule the function to run every hour
-- This checks for and unflag any users whose 24-hour flag period has expired
SELECT cron.schedule(
  'unflag-expired-users',     -- Job name
  '0 * * * *',                 -- Run every hour at minute 0 (cron format: minute hour day month weekday)
  $$SELECT unflag_expired_users()$$
);

-- Alternative: If pg_cron is not available, you can manually run this query periodically
-- Or call the function from your application on a schedule

-- To manually check and unflag expired users, run:
-- SELECT unflag_expired_users();

-- To see the current cron jobs:
-- SELECT * FROM cron.job;

-- To unschedule the job (if needed):
-- SELECT cron.unschedule('unflag-expired-users');

-- Step 4: Create a function to check a specific user's flag expiration
CREATE OR REPLACE FUNCTION is_user_flag_expired(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  flag_expired BOOLEAN;
BEGIN
  SELECT 
    CASE 
      WHEN moderation_status = 'flagged' 
        AND moderated_at IS NOT NULL 
        AND moderated_at < (NOW() - INTERVAL '24 hours')
      THEN TRUE
      ELSE FALSE
    END INTO flag_expired
  FROM public.profiles
  WHERE id = user_id_param;
  
  RETURN COALESCE(flag_expired, FALSE);
END;
$$;

-- Add comment
COMMENT ON FUNCTION is_user_flag_expired(UUID) IS 
'Returns TRUE if a user has been flagged for more than 24 hours and should be automatically unflagged.';

-- Step 5: Create a trigger to automatically unflag users when they try to perform actions
-- This ensures users are unflagged even if the cron job hasn't run yet
CREATE OR REPLACE FUNCTION check_and_unflag_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is flagged and if 24 hours have passed
  IF EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = NEW.user_id 
      AND moderation_status = 'flagged'
      AND moderated_at IS NOT NULL
      AND moderated_at < (NOW() - INTERVAL '24 hours')
  ) THEN
    -- Automatically unflag the user
    UPDATE public.profiles
    SET 
      moderation_status = 'active',
      moderation_reason = NULL,
      moderated_by = NULL,
      moderated_at = NULL
    WHERE id = NEW.user_id;
    
    RAISE NOTICE 'User % automatically unflagged after 24 hours', NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Note: The trigger should be added to tables where users perform actions
-- Example for posts table (uncomment to enable):
-- DROP TRIGGER IF EXISTS auto_unflag_user_on_post ON public.posts;
-- CREATE TRIGGER auto_unflag_user_on_post
--   BEFORE INSERT ON public.posts
--   FOR EACH ROW
--   EXECUTE FUNCTION check_and_unflag_user();

-- Example for replies table (uncomment to enable):
-- DROP TRIGGER IF EXISTS auto_unflag_user_on_reply ON public.replies;
-- CREATE TRIGGER auto_unflag_user_on_reply
--   BEFORE INSERT ON public.replies
--   FOR EACH ROW
--   EXECUTE FUNCTION check_and_unflag_user();

-- Example for likes table (uncomment to enable):
-- DROP TRIGGER IF EXISTS auto_unflag_user_on_like ON public.likes;
-- CREATE TRIGGER auto_unflag_user_on_like
--   BEFORE INSERT ON public.likes
--   FOR EACH ROW
--   EXECUTE FUNCTION check_and_unflag_user();

-- Verification queries:
-- Check flagged users and their flag duration:
-- SELECT 
--   id,
--   username,
--   moderation_status,
--   moderation_reason,
--   moderated_at,
--   (NOW() - moderated_at) as flag_duration,
--   CASE 
--     WHEN moderated_at < (NOW() - INTERVAL '24 hours') THEN 'EXPIRED'
--     ELSE 'ACTIVE'
--   END as flag_status
-- FROM public.profiles
-- WHERE moderation_status = 'flagged';

