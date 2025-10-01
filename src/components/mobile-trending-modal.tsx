'use client'

import { useState, useEffect } from 'react'
import { X, TrendingUp, Coins } from 'lucide-react'
import { TrendingTokens } from '@/components/trending-tokens'
import { FeaturedTokens } from '@/components/featured-tokens'
import { supabase } from '@/lib/supabase'

interface MobileTrendingModalProps {
  isOpen: boolean
  onClose: () => void
}

export const MobileTrendingModal = ({ isOpen, onClose }: MobileTrendingModalProps) => {
  const [hasTokens, setHasTokens] = useState<boolean | null>(null)

  useEffect(() => {
    const checkForTokens = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id')
          .not('token_symbol', 'is', null)
          .neq('token_symbol', '')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1)
        
        if (!error) {
          setHasTokens(data && data.length > 0)
        }
      } catch (error) {
        console.error('Error checking for tokens:', error)
        setHasTokens(false)
      }
    }

    if (isOpen) {
      checkForTokens()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ touchAction: 'none' }}
    >
      <div 
        className="bg-black border border-gray-800 rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: '#374151 #000000',
          touchAction: 'pan-y'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-black border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Trending & Featured</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 pb-6">
          {/* Featured Tokens Section */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Coins className="h-5 w-5 text-yellow-400" />
              <h3 className="text-md font-semibold text-white">Featured Tokens</h3>
            </div>
            <FeaturedTokens limit={3} />
          </div>

          {/* Trending Tokens Section */}
          {hasTokens && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <h3 className="text-md font-semibold text-white">Trending Tokens</h3>
              </div>
              <div className="bg-black rounded-xl border border-gray-800 p-4">
                <TrendingTokens limit={5} timePeriod="24 hours" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
