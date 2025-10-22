-- Add moderation_flag notification type to the notifications table constraint
-- This allows notifications to be sent when users are flagged by admins

-- First, drop the existing constraint
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Recreate the constraint with the new notification type included
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (
  type = ANY (
    ARRAY[
      'follow'::text,
      'like'::text,
      'comment'::text,
      'payout_available'::text,
      'alpha_chat_subscription'::text,
      'moderation_flag'::text
    ]
  )
);

-- Add comment for documentation
COMMENT ON CONSTRAINT notifications_type_check ON public.notifications IS 
'Ensures notification type is one of: follow, like, comment, payout_available, alpha_chat_subscription, moderation_flag';

