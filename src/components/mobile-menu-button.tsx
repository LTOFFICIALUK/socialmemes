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
            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 w-full text-left hover:bg-white/5 hover:text-white cursor-pointer"
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
            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 w-full text-left hover:bg-white/5 hover:text-white cursor-pointer"
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
            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 w-full text-left hover:bg-white/5 hover:text-white cursor-pointer"
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

        {/* Telegram Link */}
        <a
          href="https://t.me/socialmemesfun"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
          onClick={() => setIsMenuOpen(false)}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          <span>Telegram</span>
        </a>

        {/* X (Twitter) Link */}
        <a
          href="https://x.com/socialmemesfun"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
          onClick={() => setIsMenuOpen(false)}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span>X</span>
        </a>

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
            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 w-full text-left hover:bg-white/5 hover:text-white cursor-pointer"
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
        className="p-2 rounded-lg text-gray-400 cursor-pointer"
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
