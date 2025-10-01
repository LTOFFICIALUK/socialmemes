'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

interface FeaturedTokenModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// Calculate price based on days (2 SOL per day)
// Minimum 1 day, maximum 7 days
const calculatePrice = (days: number) => {
  return days * 2
}

const MAX_FEATURED_TOKENS = 8

export const FeaturedTokenModal = ({ isOpen, onClose, onSuccess }: FeaturedTokenModalProps) => {
  const [title, setTitle] = useState('')
  const [destinationUrl, setDestinationUrl] = useState('')
  const [selectedDuration, setSelectedDuration] = useState(1) // Default to 1 day
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeCount, setActiveCount] = useState(0)
  const [isCheckingCapacity, setIsCheckingCapacity] = useState(true)
  const [isDragging, setIsDragging] = useState(false)

  const totalCost = calculatePrice(selectedDuration)
  const isAtCapacity = activeCount >= MAX_FEATURED_TOKENS

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('')
      setTitle('')
      setDestinationUrl('')
      setImageFile(null)
      setImagePreview(null)
      setSelectedDuration(1)
      checkCapacity()
    }
  }, [isOpen])

  const checkCapacity = async () => {
    try {
      setIsCheckingCapacity(true)
      const response = await fetch('/api/featured-tokens?limit=100')
      const data = await response.json()
      if (data.success) {
        setActiveCount(data.featuredTokens.length)
      }
    } catch (error) {
      console.error('Error checking capacity:', error)
    } finally {
      setIsCheckingCapacity(false)
    }
  }

  const validateAndSetImage = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image must be smaller than 5MB')
      return
    }

    // Validate image is square
    const img = new Image()
    img.onload = () => {
      if (img.width !== img.height) {
        setErrorMessage('Image must be square (same width and height)')
        return
      }

      // Image is valid and square
      setImageFile(file)
      setErrorMessage('')

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
    img.src = URL.createObjectURL(file)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    validateAndSetImage(file)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      validateAndSetImage(files[0])
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const uploadImage = async (file: File): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const fileExt = file.name.split('.').pop()
    const fileName = `${session.user.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('featured-tokens')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('featured-tokens')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handlePromote = async () => {
    // Check capacity first
    if (isAtCapacity) {
      setErrorMessage('Featured tokens are at maximum capacity. Please try again later.')
      return
    }

    // Validation
    if (!imageFile) {
      setErrorMessage('Please select an image')
      return
    }

    if (!destinationUrl.trim()) {
      setErrorMessage('Please enter a destination URL')
      return
    }

    // Validate URL format
    try {
      new URL(destinationUrl)
    } catch {
      setErrorMessage('Please enter a valid URL (including https://)')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      // 1. Upload image
      const imageUrl = await uploadImage(imageFile)

      // ===== PAYMENT COMMENTED OUT FOR TESTING =====
      // // 2. Connect wallet
      // const provider = window.phantom?.solana
      // if (!provider?.isPhantom) {
      //   throw new Error('Phantom wallet not found. Please install Phantom wallet.')
      // }

      // if (!provider.isConnected) {
      //   await provider.connect()
      // }

      // const publicKey = provider.publicKey?.toString()
      // if (!publicKey) {
      //   throw new Error('Failed to get wallet address')
      // }

      // // 3. Create and send transaction
      // const connection = new Connection('https://api.devnet.solana.com')
      // const transaction = new Transaction()
      
      // transaction.add(
      //   SystemProgram.transfer({
      //     fromPubkey: new PublicKey(publicKey),
      //     toPubkey: new PublicKey(getRevenueWalletAddress()),
      //     lamports: solToLamports(totalCost),
      //   })
      // )

      // const { blockhash } = await connection.getLatestBlockhash()
      // transaction.recentBlockhash = blockhash
      // transaction.feePayer = new PublicKey(publicKey)

      // const signedTransaction = await provider.signTransaction(transaction)
      // const signature = await connection.sendRawTransaction(signedTransaction.serialize())
 
      // TEMPORARY: Use dummy values for testing
      const signature = 'test_signature_' + Date.now()
      const publicKey = 'test_wallet_address'
      // ===== END PAYMENT COMMENTED OUT =====

      // 4. Call API to create featured token (convert days to hours for API)
      const response = await fetch('/api/featured-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || null,
          imageUrl,
          destinationUrl: destinationUrl.trim(),
          duration: selectedDuration * 24, // Convert days to hours
          price: totalCost,
          signature,
          fromAddress: publicKey,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create featured token')
      }

      // Success
      onSuccess()
      onClose()

    } catch (error) {
      console.error('Error creating featured token:', error)
      
      if (error instanceof Error && error.message.includes('User rejected')) {
        setErrorMessage('Transaction was cancelled. Please try again if you would like to proceed.')
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to create featured token')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gray-700 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-black z-10">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold text-white">Promote Featured Token</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Image (Square required)
            </label>
            {imagePreview ? (
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-700">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 rounded-full text-white transition-colors"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                  <div className="flex flex-col items-center justify-center py-8">
                    <Upload className={`h-12 w-12 mb-3 ${isDragging ? 'text-green-400' : 'text-gray-400'}`} />
                    <p className={`text-sm mb-1 ${isDragging ? 'text-green-400' : 'text-gray-400'}`}>
                      {isDragging ? 'Drop image here' : 'Click or drag to upload image'}
                    </p>
                    <p className="text-xs text-gray-500">Square images only (PNG, JPG up to 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Title (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., $TOKEN"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
              maxLength={30}
            />
          </div>

          {/* Destination URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Destination URL
            </label>
            <input
              type="url"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">Users will be directed here when they click</p>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Duration (in days)</label>
            <div className="relative">
              <input
                type="range"
                min="1"
                max="7"
                step="1"
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${((selectedDuration - 1) / (7 - 1)) * 100}%, #374151 ${((selectedDuration - 1) / (7 - 1)) * 100}%, #374151 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>1 day</span>
                <span>7 days</span>
              </div>
            </div>
            <div className="text-center mt-3">
              <span className="text-2xl font-bold text-white">
                {selectedDuration === 1 ? '1 day' : `${selectedDuration} days`}
              </span>
            </div>
          </div>

          {/* Capacity Info */}
          {!isCheckingCapacity && (
            <div className={`p-3 rounded-lg border ${isAtCapacity ? 'bg-red-900/20 border-red-800' : 'bg-gray-900 border-gray-700'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Available Slots</span>
                <span className={`text-sm font-medium ${isAtCapacity ? 'text-red-400' : 'text-green-400'}`}>
                  {MAX_FEATURED_TOKENS - activeCount} / {MAX_FEATURED_TOKENS}
                </span>
              </div>
            </div>
          )}

          {/* Total Cost */}
          <div className="flex justify-between items-center p-4 bg-gray-900 rounded-lg border border-gray-700">
            <div>
              <div className="text-sm text-gray-400">Total Cost</div>
              <div className="text-2xl font-bold text-white">
                {totalCost} SOL
              </div>
              <div className="text-xs text-gray-500 mt-1">
                2 SOL per day
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
          <Button
            onClick={handlePromote}
            disabled={isLoading || isAtCapacity || isCheckingCapacity}
            className={`w-full py-3 text-lg font-medium ${
              isAtCapacity 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isCheckingCapacity ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Checking availability...</span>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : isAtCapacity ? (
              'At Maximum Capacity'
            ) : (
              'Pay with Phantom'
            )}
          </Button>

          {errorMessage && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm text-center">{errorMessage}</p>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center mt-3">
            By clicking Pay with Phantom, you&apos;re indicating that you have read and agree to the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Terms and Advertising Guidelines</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

