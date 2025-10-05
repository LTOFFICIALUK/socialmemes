'use client'

import { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Profile, updateProfile } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { X, Camera } from 'lucide-react'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: Profile
  onProfileUpdate: (updatedProfile: Profile) => void
}

export const EditProfileModal = ({ 
  isOpen, 
  onClose, 
  profile,
  onProfileUpdate 
}: EditProfileModalProps) => {
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    bio: profile.bio || '',
    username: profile.username
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setAvatarPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setBannerPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleBannerDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setBannerFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setBannerPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleBannerDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile.id) return

    try {
      setIsLoading(true)
      
      let avatarUrl = profile.avatar_url
      let bannerUrl = profile.banner_url

      // Upload avatar if changed
      if (avatarFile) {
        const avatarPath = `${profile.id}/avatar-${Date.now()}`
        avatarUrl = await uploadFile(avatarFile, 'memes', avatarPath)
      }

      // Upload banner if changed
      if (bannerFile) {
        const bannerPath = `${profile.id}/banner-${Date.now()}`
        bannerUrl = await uploadFile(bannerFile, 'banners', bannerPath)
      }

      // Update profile
      const updatedProfile = await updateProfile(profile.id, {
        full_name: formData.full_name || null,
        bio: formData.bio || null,
        avatar_url: avatarUrl,
        banner_url: bannerUrl
      })

      onProfileUpdate(updatedProfile)
      onClose()
    } catch (error) {
      console.error('Error updating profile:', error)
      // You might want to show a toast notification here
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-20 lg:pb-4">
      <div className="bg-black border border-gray-800 rounded-lg w-full max-w-2xl max-h-[calc(100vh-8rem)] lg:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Banner Section */}
          <div className="space-y-6">
            <label className="text-sm font-medium text-white mb-2 block">
              Banner <span className="text-gray-400 font-normal">(Recommended: 1500x500px)</span>
            </label>
            <div className="relative">
              <div 
                className="w-full h-32 bg-black border border-gray-700 rounded-lg overflow-hidden cursor-pointer hover:border-gray-600 transition-colors"
                onClick={() => bannerInputRef.current?.click()}
                onDrop={handleBannerDrop}
                onDragOver={handleBannerDragOver}
              >
                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                ) : profile.banner_url ? (
                  <img
                    src={profile.banner_url}
                    alt="Current banner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Camera className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Click or drag to upload banner</p>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Avatar Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white mb-2 block">Profile Picture</label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar 
                  className="h-20 w-20 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <AvatarImage 
                    src={avatarPreview || profile.avatar_url || undefined} 
                    alt="Profile" 
                  />
                  <AvatarFallback className="bg-green-500 text-white font-semibold text-2xl">
                    {profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div className="text-sm text-gray-400">
                <p>Click the avatar to change your profile picture</p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-white mb-2">
                Full Name
              </label>
              <textarea
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                rows={1}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-white mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself"
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-0">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
