import { supabase } from './supabase'

export interface ModerationStatus {
  status: 'active' | 'flagged' | 'banned'
  reason?: string | null
}

/**
 * Check if the current user is flagged or banned
 * Automatically unflag users if their 24-hour flag period has expired
 */
export const checkUserModerationStatus = async (): Promise<ModerationStatus | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return null
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('moderation_status, moderation_reason, moderated_at')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error checking moderation status:', error)
      return null
    }

    // Check if user is flagged and if 24 hours have passed
    if (profile?.moderation_status === 'flagged' && profile?.moderated_at) {
      const moderatedAt = new Date(profile.moderated_at)
      const now = new Date()
      const hoursSinceFlagged = (now.getTime() - moderatedAt.getTime()) / (1000 * 60 * 60)
      
      // If more than 24 hours have passed, automatically unflag the user
      if (hoursSinceFlagged >= 24) {
        console.log('Flag expired, automatically unflagging user')
        
        // Call the unflag function
        const { error: unflagError } = await supabase
          .from('profiles')
          .update({
            moderation_status: 'active',
            moderation_reason: null,
            moderated_by: null,
            moderated_at: null
          })
          .eq('id', user.id)
        
        if (unflagError) {
          console.error('Error automatically unflagging user:', unflagError)
          // Return the current status even if update fails
        } else {
          // User has been unflagged, return active status
          return {
            status: 'active',
            reason: null
          }
        }
      }
    }

    return {
      status: profile?.moderation_status || 'active',
      reason: profile?.moderation_reason
    }
  } catch (error) {
    console.error('Error in checkUserModerationStatus:', error)
    return null
  }
}

/**
 * Check if user can perform actions (post, comment, reply)
 */
export const canUserPerformActions = async (): Promise<boolean> => {
  const status = await checkUserModerationStatus()
  return status?.status === 'active'
}

/**
 * Get moderation error message for flagged users
 */
export const getModerationErrorMessage = (status: ModerationStatus): string => {
  switch (status.status) {
    case 'flagged':
      return 'Your account has been flagged and posting is restricted. Please try again later or contact support.'
    case 'banned':
      return 'Your account has been banned. Please contact support if you believe this is an error.'
    default:
      return 'You do not have permission to perform this action.'
  }
}
