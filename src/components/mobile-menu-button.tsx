'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MoreVertical, BookOpen, LogOut, TrendingUp, BarChart3, Users, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileMenuButtonProps {
  currentUser?: {
    id: string
    username: string
    avatar_url?: string
  }
  onSignOut?: () => void
  onPromoteClick?: () => void
  onTrendingClick?: () => void
  onProClick?: () => void
}

export const MobileMenuButton = ({ currentUser, onSignOut, onPromoteClick, onTrendingClick, onProClick }: MobileMenuButtonProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = () => {
    onSignOut?.()
    setIsMenuOpen(false)
  }

  const handleMenuToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setButtonRect(rect)
    setIsMenuOpen(!isMenuOpen)
  }

  const dropdownContent = isMenuOpen && buttonRect && mounted ? (
    <>
      {/* Backdrop - Invisible click area */}
      <div 
        className="fixed inset-0"
        style={{ 
          zIndex: 2147483646,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent'
        }}
        onClick={() => setIsMenuOpen(false)}
      />
      
      {/* Menu */}
      <div 
        className="fixed w-48 border border-gray-800 rounded-lg shadow-xl py-2"
        style={{ 
          zIndex: 2147483647, // Maximum safe integer for z-index
          right: `${window.innerWidth - buttonRect.right}px`,
          top: `${buttonRect.bottom + 8}px`,
          backgroundColor: '#000000',
          position: 'fixed'
        }}
      >
        {/* Pro Button */}
        {onProClick && (
          <button
            onClick={() => {
              onProClick()
              setIsMenuOpen(false)
            }}
            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 w-full text-left hover:bg-white/5 hover:text-white"
          >
            <Crown className="h-4 w-4" />
            <span>Pro</span>
          </button>
        )}

        {/* Promote Token Button */}
        {currentUser && onPromoteClick && (
          <button
            onClick={() => {
              onPromoteClick()
              setIsMenuOpen(false)
            }}
            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 w-full text-left hover:bg-white/5 hover:text-white"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Promote a Token</span>
          </button>
        )}

        {/* Trending Tokens Button */}
        {onTrendingClick && (
          <button
            onClick={() => {
              onTrendingClick()
              setIsMenuOpen(false)
            }}
            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 w-full text-left hover:bg-white/5 hover:text-white"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Trending Tokens</span>
          </button>
        )}

        {/* Referrals Link */}
        {currentUser && (
          <Link
            href="/referrals"
            className={cn(
              "flex items-center space-x-3 px-4 py-2 text-sm",
              pathname === '/referrals'
                ? "text-white bg-white bg-opacity-5"
                : "text-gray-300 hover:bg-white/5 hover:text-white"
            )}
            onClick={() => setIsMenuOpen(false)}
          >
            <Users className="h-4 w-4" />
            <span>Referrals</span>
          </Link>
        )}

        {/* Docs Link */}
        <Link
          href="/docs"
          className={cn(
            "flex items-center space-x-3 px-4 py-2 text-sm",
            pathname === '/docs'
              ? "text-white bg-white bg-opacity-5"
              : "text-gray-300 hover:bg-white/5 hover:text-white"
          )}
          onClick={() => setIsMenuOpen(false)}
        >
          <BookOpen className="h-4 w-4" />
          <span>Docs</span>
        </Link>

        {/* Logout Button */}
        {currentUser && (
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 w-full text-left hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        )}
      </div>
    </>
  ) : null

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={handleMenuToggle}
        className="p-2 rounded-lg text-gray-400"
        aria-label="Open menu"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {/* Render dropdown using portal */}
      {mounted && typeof document !== 'undefined' && dropdownContent && 
        createPortal(dropdownContent, document.body)
      }
    </>
  )
}
