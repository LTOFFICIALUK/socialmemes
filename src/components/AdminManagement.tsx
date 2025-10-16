'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Shield, 
  Calendar,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

interface AdminUser {
  id: string
  user_id: string
  created_at: string
  created_by: string
  is_active: boolean
  permissions: Record<string, unknown>
  profiles?: {
    username: string
  }
}

interface AdminManagementProps {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export const AdminManagement = ({ onSuccess, onError }: AdminManagementProps) => {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [newAdminUsername, setNewAdminUsername] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        onError?.('No active session found')
        return
      }

      const response = await fetch('/api/admin/manage', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      
      if (result.success) {
        setAdmins(result.admins)
      } else {
        onError?.(result.error || 'Failed to fetch admin users')
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
      onError?.('Failed to fetch admin users')
    } finally {
      setIsLoading(false)
    }
  }

  const addAdmin = async () => {
    if (!newAdminUsername.trim()) {
      onError?.('Please enter a username')
      return
    }

    setIsAdding(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        onError?.('No active session found')
        setIsAdding(false)
        return
      }

      // Send username to API - it will look up the user server-side
      const response = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'add',
          username: newAdminUsername.trim(),
          permissions: { role: 'admin' }
        })
      })

      const result = await response.json()
      
      if (result.success) {
        onSuccess?.(`Successfully added ${newAdminUsername.trim()} as admin`)
        setNewAdminUsername('')
        setShowAddForm(false)
        fetchAdmins() // Refresh the list
      } else {
        onError?.(result.error || 'Failed to add admin user')
      }
    } catch (error) {
      console.error('Error adding admin:', error)
      onError?.('Failed to add admin user')
    } finally {
      setIsAdding(false)
    }
  }

  const removeAdmin = async (adminId: string, userId: string, username: string) => {
    if (!confirm(`Are you sure you want to remove admin access from ${username}?`)) {
      return
    }

    setIsRemoving(userId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        onError?.('No active session found')
        setIsRemoving(null)
        return
      }

      const response = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'remove',
          userId: userId
        })
      })

      const result = await response.json()
      
      if (result.success) {
        onSuccess?.(`Successfully removed admin access from ${username}`)
        fetchAdmins() // Refresh the list
      } else {
        onError?.(result.error || 'Failed to remove admin user')
      }
    } catch (error) {
      console.error('Error removing admin:', error)
      onError?.('Failed to remove admin user')
    } finally {
      setIsRemoving(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredAdmins = admins.filter(admin => {
    const searchLower = searchQuery.toLowerCase()
    const username = admin.profiles?.username?.toLowerCase() || ''
    return username.includes(searchLower)
  })

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Admin Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400">Loading admin users...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Admin Management</h2>
          <span className="text-sm text-gray-400">({admins.length} admins)</span>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Admin
        </Button>
      </div>

      {/* Add Admin Form */}
      {showAddForm && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="w-4 h-4" />
            <h3 className="font-medium">Add New Admin</h3>
          </div>
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Enter username"
              value={newAdminUsername}
              onChange={(e) => setNewAdminUsername(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white flex-1"
            />
            <Button
              onClick={addAdmin}
              disabled={isAdding || !newAdminUsername.trim()}
              className="flex items-center gap-2"
            >
              {isAdding ? 'Adding...' : 'Add Admin'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false)
                setNewAdminUsername('')
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Enter the username of the user you want to make an admin
          </p>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search admins by username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-gray-800 border-gray-600 text-white"
        />
      </div>

      {/* Admin List */}
      <div className="space-y-3">
        {filteredAdmins.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">
              {searchQuery ? 'No admins found matching your search' : 'No admin users found'}
            </p>
          </div>
        ) : (
          filteredAdmins.map((admin) => (
            <div key={admin.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {admin.profiles?.username || 'Unknown User'}
                      </h3>
                      <div className="flex items-center gap-1 text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        <span className="text-xs">Active</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Added {formatDate(admin.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeAdmin(
                    admin.id, 
                    admin.user_id, 
                    admin.profiles?.username || 'Unknown User'
                  )}
                  disabled={isRemoving === admin.user_id}
                  className="text-red-400 border-red-400 hover:bg-red-400/10"
                >
                  {isRemoving === admin.user_id ? (
                    'Removing...'
                  ) : (
                    <>
                      <UserMinus className="w-3 h-3 mr-1" />
                      Remove
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Admin Management Info</p>
            <ul className="space-y-1 text-xs">
              <li>• Only existing admins can add or remove other admins</li>
              <li>• Admin access is managed through the database admins table</li>
              <li>• Removed admins lose access immediately but records are preserved</li>
              <li>• Use usernames to find and add users as admins</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
