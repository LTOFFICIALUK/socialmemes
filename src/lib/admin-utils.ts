import { supabase } from './supabase'

/**
 * Check if the current user is an admin
 * @param userId - Optional user ID to check, defaults to current user
 * @returns Promise<boolean> - True if user is an admin
 */
export const isUserAdmin = async (userId?: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id

    if (!targetUserId) {
      return false
    }

    // Directly query the admins table
    const { data: adminRecord, error } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }

    return !!adminRecord
  } catch (error) {
    console.error('Error in isUserAdmin:', error)
    return false
  }
}

/**
 * Add a user as an admin
 * @param userId - User ID to make admin
 * @param permissions - Optional permissions object
 * @returns Promise<boolean> - True if successful
 */
export const addAdminUser = async (
  userId: string, 
  permissions: Record<string, unknown> = {}
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const createdBy = user?.id

    const { error } = await supabase
      .from('admins')
      .insert({
        user_id: userId,
        created_by: createdBy,
        permissions,
        is_active: true
      })

    if (error) {
      console.error('Error adding admin user:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in addAdminUser:', error)
    return false
  }
}

/**
 * Remove admin access from a user
 * @param userId - User ID to remove admin access from
 * @returns Promise<boolean> - True if successful
 */
export const removeAdminUser = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('admins')
      .update({ is_active: false })
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing admin user:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in removeAdminUser:', error)
    return false
  }
}

/**
 * Get all admin users
 * @returns Promise<Array> - Array of admin users
 */
export const getAllAdmins = async () => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select(`
        id,
        user_id,
        created_at,
        created_by,
        is_active,
        permissions,
        profiles:user_id (
          username,
          email
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admin users:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllAdmins:', error)
    return []
  }
}
