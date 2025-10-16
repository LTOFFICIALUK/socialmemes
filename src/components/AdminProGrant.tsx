'use client'

import { useState } from 'react'
import { Crown, User, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast, ToastContainer } from '@/components/ui/toast'

interface AdminProGrantProps {
  onSuccess?: (message: string) => void
}

export const AdminProGrant = ({ onSuccess }: AdminProGrantProps) => {
  const [userId, setUserId] = useState('')
  const [duration, setDuration] = useState<1 | 3 | 6 | 12>(1)
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<Array<{
    id: string
    username: string
    pro: boolean
    avatar_url: string | null
  }> | null>(null)
  const { success, error: showError, warning, toasts, removeToast } = useToast()

  const durationOptions = [
    { value: 1, label: '1 Month' },
    { value: 3, label: '3 Months' },
    { value: 6, label: '6 Months' },
    { value: 12, label: '12 Months' }
  ] as const

  const handleSearchUser = async () => {
    if (!userId.trim()) {
      setSearchResults(null)
      return
    }

    try {
      const response = await fetch(`/api/admin/search-users?q=${encodeURIComponent(userId.trim())}`)
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.users)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Failed to search users:', error)
      setSearchResults([])
      showError('Failed to search users', 'Please try again')
    }
  }

  const handleGrantPro = async (targetUserId: string, targetUsername: string) => {
    if (!duration || !targetUserId) {
      warning('Missing information', 'Please select a duration and user')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/grant-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          duration,
          reason: reason.trim() || `Admin granted ${duration}-month pro subscription`
        })
      })

      const data = await response.json()

      if (data.success) {
        const message = `Successfully granted ${duration}-month Pro subscription to ${targetUsername}`
        success(message, `Pro access activated for ${targetUsername}`)
        onSuccess?.(message)
        
        // Reset form
        setUserId('')
        setReason('')
        setSearchResults(null)
        setDuration(1)
      } else {
        showError('Failed to grant Pro access', data.error)
      }
    } catch (error) {
      console.error('Failed to grant pro:', error)
      showError('Failed to grant pro subscription', 'Please try again or check your connection')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Crown className="w-6 h-6 text-yellow-400" />
          Admin Pro Grant
        </h2>
      
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Search */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Search User
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Username or User ID</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter username or user ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Button
                    variant="outline"
                    onClick={handleSearchUser}
                    disabled={!userId.trim()}
                    className="px-4"
                  >
                    Search
                  </Button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults && (
                <div className="bg-gray-700 rounded p-3">
                  <h4 className="text-sm font-medium mb-2">Search Results:</h4>
                  {searchResults.length === 0 ? (
                    <p className="text-gray-400 text-sm">No users found</p>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map((user) => (
                        <div key={user.id} className="flex items-center justify-between bg-gray-600 rounded p-2">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {user.avatar_url ? (
                                <img 
                                  src={user.avatar_url} 
                                  alt={user.username}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-gray-300" />
                                </div>
                              )}
                              {user.pro && (
                                <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{user.username}</span>
                              <span className="text-xs text-gray-400">({user.id.slice(0, 8)}...)</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {user.pro ? 'Already Pro' : 'Free'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Grant Settings */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Grant Settings
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value) as 1 | 3 | 6 | 12)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2"
                >
                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Reason (Optional)</label>
                <Input
                  type="text"
                  placeholder="Reason for granting pro access"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              {/* Grant Button */}
              {searchResults && searchResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Grant Pro Access:</h4>
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between bg-gray-600 rounded p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{user.username}</span>
                        <span className="text-xs text-gray-400">({user.id.slice(0, 8)}...)</span>
                      </div>
                      <Button
                        onClick={() => handleGrantPro(user.id, user.username)}
                        disabled={isLoading || user.pro}
                        className={`px-3 py-1 text-xs ${
                          user.pro 
                            ? 'bg-gray-500 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {user.pro ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Already Pro
                          </>
                        ) : (
                          <>
                            <Crown className="w-3 h-3 mr-1" />
                            Grant Pro
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-gray-700/50 rounded">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Instructions
          </h4>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• Search for a user by username or user ID</li>
            <li>• Select the duration for the pro subscription</li>
            <li>• Optionally add a reason for the grant</li>
            <li>• Click &quot;Grant Pro&quot; to activate the subscription</li>
            <li>• This will update the user&apos;s profile and create a subscription record</li>
          </ul>
        </div>
      </div>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}
