-- Simple automatic unflagging function (No pg_cron required)
-- This function can be called manually or from application code

-- Create the main unflagging function
CREATE OR REPLACE FUNCTION unflag_expired_users()
RETURNS TABLE(unflagged_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_rows INTEGER;
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

  -- Get the number of affected rows
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- Return the count
  RETURN QUERY SELECT affected_rows;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION unflag_expired_users() IS 
'Automatically reverts flagged users back to active status after 24 hours. Returns the number of users unflagged.';

-- To manually run and check for expired flags:
-- SELECT * FROM unflag_expired_users();

-- To see all currently flagged users and their status:
-- SELECT 
--   id,
--   username,
--   moderation_status,
--   moderation_reason,
--   moderated_at,
--   (NOW() - moderated_at) as time_since_flag,
--   CASE 
--     WHEN moderated_at < (NOW() - INTERVAL '24 hours') THEN 'EXPIRED - Will be unflagged'
--     ELSE CONCAT('Active for ', EXTRACT(EPOCH FROM (NOW() - moderated_at))/3600, ' more hours')
--   END as flag_status
-- FROM public.profiles
-- WHERE moderation_status = 'flagged'
-- ORDER BY moderated_at DESC;

