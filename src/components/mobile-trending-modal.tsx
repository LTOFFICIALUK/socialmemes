'use client'

import { X, TrendingUp, Coins } from 'lucide-react'
import { TrendingTokensSection } from '@/components/trending-tokens-section'
import { FeaturedTokens } from '@/components/featured-tokens'

interface MobileTrendingModalProps {
  isOpen: boolean
  onClose: () => void
}

export const MobileTrendingModal = ({ isOpen, onClose }: MobileTrendingModalProps) => {

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
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <h3 className="text-md font-semibold text-white">Trending Tokens</h3>
            </div>
            <TrendingTokensSection />
          </div>
        </div>
      </div>
    </div>
  )
}
