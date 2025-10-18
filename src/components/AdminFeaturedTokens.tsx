'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Star, 
  Plus, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  X,
  Eye,
  EyeOff,
  Trash2,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { uploadImageToSupabase } from '@/lib/supabase-storage'

interface FeaturedToken {
  id: string
  user_id: string
  title: string | null
  image_url: string
  destination_url: string
  is_active: boolean
  promotion_start: string
  promotion_end: string
  promotion_price: number
  payment_tx_hash: string | null
  display_order: number
  created_at: string
  profiles?: {
    username: string
    avatar_url: string | null
  }
}

interface AdminFeaturedTokensProps {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

const MAX_FEATURED_TOKENS = 8

export const AdminFeaturedTokens = ({ onSuccess, onError }: AdminFeaturedTokensProps) => {
  const [tokens, setTokens] = useState<FeaturedToken[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [destinationUrl, setDestinationUrl] = useState('')
  const [duration, setDuration] = useState(24)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchTokens()
  }, [])

  const fetchTokens = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        onError?.('No active session found')
        return
      }

      const response = await fetch('/api/admin/featured-tokens', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      
      if (result.success) {
        setTokens(result.featuredTokens)
      } else {
        onError?.(result.error || 'Failed to fetch featured tokens')
      }
    } catch (error) {
      console.error('Error fetching featured tokens:', error)
      onError?.('Failed to fetch featured tokens')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError?.('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onError?.('Image size must be less than 5MB')
      return
    }

    setImageFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      onError?.('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      onError?.('Image size must be less than 5MB')
      return
    }

    setImageFile(file)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCreateToken = async () => {
    if (!imageFile || !destinationUrl || !duration) {
      onError?.('Please fill in all required fields')
      return
    }

    // Validate URL
    try {
      new URL(destinationUrl)
    } catch {
      onError?.('Please enter a valid URL')
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        onError?.('No active session found')
        setIsSubmitting(false)
        return
      }

      // Upload image
      const imageUrl = await uploadImageToSupabase(imageFile)

      // Create featured token
      const response = await fetch('/api/admin/featured-tokens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create',
          title: title.trim() || null,
          imageUrl,
          destinationUrl: destinationUrl.trim(),
          duration
        })
      })

      const result = await response.json()
      
      if (result.success) {
        onSuccess?.('Featured token created successfully')
        setShowAddForm(false)
        resetForm()
        fetchTokens()
      } else {
        onError?.(result.error || 'Failed to create featured token')
      }
    } catch (error) {
      console.error('Error creating featured token:', error)
      onError?.('Failed to create featured token')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (tokenId: string, currentStatus: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        onError?.('No active session found')
        return
      }

      const action = currentStatus ? 'deactivate' : 'activate'
      const response = await fetch('/api/admin/featured-tokens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          tokenId
        })
      })

      const result = await response.json()
      
      if (result.success) {
        onSuccess?.(result.message)
        fetchTokens()
      } else {
        onError?.(result.error || `Failed to ${action} token`)
      }
    } catch (error) {
      console.error('Error toggling token status:', error)
      onError?.('Failed to update token status')
    }
  }

  const handleDeleteToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to delete this featured token? This action cannot be undone.')) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        onError?.('No active session found')
        return
      }

      const response = await fetch('/api/admin/featured-tokens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete',
          tokenId
        })
      })

      const result = await response.json()
      
      if (result.success) {
        onSuccess?.(result.message)
        fetchTokens()
      } else {
        onError?.(result.error || 'Failed to delete token')
      }
    } catch (error) {
      console.error('Error deleting token:', error)
      onError?.('Failed to delete token')
    }
  }

  const resetForm = () => {
    setTitle('')
    setDestinationUrl('')
    setDuration(24)
    setImageFile(null)
    setImagePreview(null)
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

  const activeTokens = tokens.filter(t => t.is_active)
  const inactiveTokens = tokens.filter(t => !t.is_active)
  const isAtCapacity = activeTokens.length >= MAX_FEATURED_TOKENS

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Featured Tokens Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400">Loading featured tokens...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          <h2 className="text-xl font-semibold">Featured Tokens Management</h2>
          <span className="text-sm text-gray-400">
            ({activeTokens.length}/{MAX_FEATURED_TOKENS} active)
          </span>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={isAtCapacity && !showAddForm}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Featured Token
        </Button>
      </div>

      {/* Capacity Warning */}
      {isAtCapacity && !showAddForm && (
        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-300">
              At maximum capacity ({MAX_FEATURED_TOKENS} active tokens). Deactivate some tokens to add new ones.
            </span>
          </div>
        </div>
      )}

      {/* Add Token Form */}
      {showAddForm && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <h3 className="font-medium">Add New Featured Token</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddForm(false)
                resetForm()
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <ImageIcon className="w-4 h-4 inline mr-1" />
                Token Image <span className="text-red-400">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Upload image"
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-40 mx-auto rounded"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setImageFile(null)
                        setImagePreview(null)
                      }}
                      className="mt-2"
                    >
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <div>
                    <ImageIcon className="w-12 h-12 mx-auto text-gray-500 mb-2" />
                    <p className="text-sm text-gray-400">
                      Click or drag & drop an image here
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Max 5MB, PNG/JPG/GIF
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Token Title (Optional)
              </label>
              <Input
                type="text"
                placeholder="Enter token title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* Destination URL */}
            <div>
              <label className="block text-sm font-medium mb-1">
                <LinkIcon className="w-4 h-4 inline mr-1" />
                Destination URL <span className="text-red-400">*</span>
              </label>
              <Input
                type="url"
                placeholder="https://example.com"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Duration (hours) <span className="text-red-400">*</span>
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2"
              >
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>1 day (24 hours)</option>
                <option value={48}>2 days (48 hours)</option>
                <option value={72}>3 days (72 hours)</option>
                <option value={168}>1 week (168 hours)</option>
                <option value={336}>2 weeks (336 hours)</option>
                <option value={720}>30 days (720 hours)</option>
              </select>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleCreateToken}
              disabled={isSubmitting || !imageFile || !destinationUrl || isAtCapacity}
              className="w-full"
            >
              {isSubmitting ? 'Creating...' : 'Create Featured Token'}
            </Button>
          </div>
        </div>
      )}

      {/* Active Tokens */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4 text-green-400" />
          Active Tokens ({activeTokens.length})
        </h3>
        <div className="space-y-3">
          {activeTokens.length === 0 ? (
            <div className="text-center py-8 bg-gray-800 rounded-lg">
              <Star className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No active featured tokens</p>
            </div>
          ) : (
            activeTokens.map((token) => (
              <div key={token.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  {/* Token Image */}
                  <img
                    src={token.image_url}
                    alt={token.title || 'Featured token'}
                    className="w-20 h-20 rounded object-cover"
                  />

                  {/* Token Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        {token.title && (
                          <h4 className="font-medium mb-1">{token.title}</h4>
                        )}
                        <a
                          href={token.destination_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300 break-all"
                        >
                          {token.destination_url}
                        </a>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(token.promotion_start)}
                          </div>
                          <span>→</span>
                          <div className="flex items-center gap-1">
                            {formatDate(token.promotion_end)}
                          </div>
                        </div>
                        {token.profiles && (
                          <div className="text-xs text-gray-500 mt-1">
                            Created by: @{token.profiles.username}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(token.id, token.is_active)}
                          className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
                        >
                          <EyeOff className="w-3 h-3 mr-1" />
                          Deactivate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteToken(token.id)}
                          className="text-red-400 border-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Inactive Tokens */}
      {inactiveTokens.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-gray-400" />
            Inactive Tokens ({inactiveTokens.length})
          </h3>
          <div className="space-y-3">
            {inactiveTokens.map((token) => (
              <div key={token.id} className="bg-gray-800/50 rounded-lg p-4 opacity-60">
                <div className="flex items-start gap-4">
                  {/* Token Image */}
                  <img
                    src={token.image_url}
                    alt={token.title || 'Featured token'}
                    className="w-20 h-20 rounded object-cover grayscale"
                  />

                  {/* Token Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        {token.title && (
                          <h4 className="font-medium mb-1">{token.title}</h4>
                        )}
                        <a
                          href={token.destination_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300 break-all"
                        >
                          {token.destination_url}
                        </a>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(token.promotion_start)}
                          </div>
                          <span>→</span>
                          <div className="flex items-center gap-1">
                            {formatDate(token.promotion_end)}
                          </div>
                        </div>
                        {token.profiles && (
                          <div className="text-xs text-gray-500 mt-1">
                            Created by: @{token.profiles.username}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(token.id, token.is_active)}
                          disabled={isAtCapacity}
                          className="text-green-400 border-green-400 hover:bg-green-400/10"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Activate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteToken(token.id)}
                          className="text-red-400 border-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Featured Tokens Info</p>
            <ul className="space-y-1 text-xs">
              <li>• Maximum of {MAX_FEATURED_TOKENS} active featured tokens at a time</li>
              <li>• Admin-created tokens have no payment required</li>
              <li>• Tokens will automatically expire after their duration</li>
              <li>• You can activate/deactivate tokens manually</li>
              <li>• Deleting a token is permanent and cannot be undone</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

