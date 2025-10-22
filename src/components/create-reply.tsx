'use client'

import { useState, useRef, useEffect } from 'react'
import { Image, X, Loader2, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TokenModal } from '@/components/ui/token-modal'
import { cn } from '@/lib/utils'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { checkUserModerationStatus, getModerationErrorMessage } from '@/lib/moderation-utils'

interface CreateReplyProps {
  currentUser: {
    id: string
    username: string
    avatar_url?: string
  }
  onSubmit: (data: {
    content?: string
    image?: File
    tokenSymbol?: string
    tokenAddress?: string
    tokenName?: string
  }) => Promise<void>
  isSubmitting?: boolean
  parentReplyId?: string
  onCancel?: () => void
}

export const CreateReply = ({ currentUser, onSubmit, isSubmitting, parentReplyId, onCancel }: CreateReplyProps) => {
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [tokenAddress, setTokenAddress] = useState('')
  const [tokenName, setTokenName] = useState('')
  const [tokenLogo, setTokenLogo] = useState<string | undefined>(undefined)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const [canReply, setCanReply] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { warning, toasts, removeToast } = useToast()

  // Check user moderation status
  useEffect(() => {
    const checkModerationStatus = async () => {
      const status = await checkUserModerationStatus()
      if (status && status.status !== 'active') {
        setCanReply(false)
      }
    }
    checkModerationStatus()
  }, [])

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  const processImageFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert('Image size must be less than 10MB')
      return
    }

    setImage(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => prev + 1)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => prev - 1)
    if (dragCounter <= 1) {
      setIsDragOver(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setDragCounter(0)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      processImageFile(file)
    }
  }

  const handleRemoveImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleTokenSelect = (tokenInfo: { symbol: string; name: string; address: string; dexScreenerUrl?: string; logo?: string }) => {
    setTokenSymbol(tokenInfo.symbol)
    setTokenName(tokenInfo.name)
    setTokenAddress(tokenInfo.address)
    setTokenLogo(tokenInfo.logo)
  }

  const handleRemoveToken = () => {
    setTokenSymbol('')
    setTokenName('')
    setTokenAddress('')
    setTokenLogo(undefined)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check moderation status before submitting
    if (!canReply) {
      const status = await checkUserModerationStatus()
      if (status) {
        warning('Action Restricted', getModerationErrorMessage(status))
      }
      return
    }
    
    if (!image && !content.trim()) {
      alert('Please add some text or select an image')
      return
    }

    try {
      await onSubmit({
        content: content.trim() || undefined,
        image: image || undefined,
        tokenSymbol: tokenSymbol.trim() || undefined,
        tokenAddress: tokenAddress.trim() || undefined,
        tokenName: tokenName.trim() || undefined,
      })
      
      // Reset form
      setContent('')
      setImage(null)
      setImagePreview(null)
      setTokenSymbol('')
      setTokenAddress('')
      setTokenName('')
      setTokenLogo(undefined)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error creating reply:', error)
    }
  }

  const isDisabled = (!image && !content.trim()) || isSubmitting

  return (
    <div className="border-b border-gray-800">
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser.avatar_url || undefined} alt={currentUser.username} />
            <AvatarFallback className="bg-purple-400 text-white font-semibold">
              {currentUser.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 relative">
            <textarea
              placeholder={parentReplyId ? "Reply to this comment..." : "Post your reply"}
              value={content}
              onChange={handleTextareaChange}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={cn(
                "w-full resize-none border-none outline-none text-xl placeholder-gray-500 bg-transparent text-white transition-all duration-200 leading-6 pt-1",
                isDragOver && "bg-green-500/10 border-2 border-dashed border-green-500 rounded-lg p-4"
              )}
              maxLength={280}
              style={{ lineHeight: '1.5rem', height: '1.75rem' }}
            />
            
            {/* Drag overlay */}
            {isDragOver && (
              <div className="absolute inset-0 bg-green-500/20 border-2 border-dashed border-green-500 rounded-lg flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <Image className="h-8 w-8 mx-auto mb-2 text-green-400" />
                  <p className="text-green-400 font-medium">Drop image here</p>
                </div>
              </div>
            )}

            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-[32rem] object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/80 hover:bg-black/90 text-white"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 -ml-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-full"
                >
                  <Image className="h-5 w-5" />
                </Button>
                
                {/* Token toggle button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTokenModal(true)}
                  className={cn(
                    "rounded-full transition-colors overflow-hidden flex items-center space-x-2 px-3",
                    (tokenSymbol || tokenAddress || tokenName)
                      ? "text-green-400 bg-green-500/10 hover:bg-green-500/20" 
                      : "text-gray-400 hover:text-green-400 hover:bg-green-500/10"
                  )}
                  title={(tokenSymbol || tokenAddress || tokenName) ? "Change token" : "Link token"}
                >
                  {tokenLogo ? (
                    <img 
                      src={tokenLogo} 
                      alt={`${tokenSymbol} logo`}
                      className="h-5 w-5 rounded-full object-cover"
                      onError={(e) => {
                        // Fallback to coin icon if image fails to load
                        e.currentTarget.style.display = 'none'
                        const coinsIcon = e.currentTarget.parentElement?.querySelector('.coins-icon')
                        if (coinsIcon) {
                          coinsIcon.setAttribute('style', 'display: block')
                        }
                      }}
                    />
                  ) : (
                    <Coins 
                      className="h-5 w-5 coins-icon"
                    />
                  )}
                  {(tokenSymbol || tokenAddress || tokenName) && (
                    <span className="text-sm font-medium">
                      ${tokenSymbol}
                    </span>
                  )}
                </Button>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-500">
                  {content.length}/280
                </div>
                {onCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    className="px-4 rounded-full font-semibold text-gray-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isDisabled}
                  className={cn(
                    "px-6 rounded-full font-semibold",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Replying...
                    </>
                  ) : (
                    'Reply'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Token Modal */}
      <TokenModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        onTokenSelect={handleTokenSelect}
        currentToken={
          (tokenSymbol || tokenAddress || tokenName) ? {
            symbol: tokenSymbol,
            name: tokenName,
            address: tokenAddress,
            decimals: 9,
            logo: tokenLogo,
            dexScreenerUrl: undefined
          } : null
        }
        onTokenRemove={handleRemoveToken}
      />
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
