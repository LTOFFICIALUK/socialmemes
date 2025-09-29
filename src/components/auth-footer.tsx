'use client'

import Link from 'next/link'
import { BookOpen } from 'lucide-react'

const AuthFooter = () => {
  return (
    <div className="flex items-center justify-center space-x-6 text-white text-sm">
      {/* X Account Link */}
      <a
        href="https://x.com/socialmemes"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center hover:text-gray-300 transition-colors"
        aria-label="Follow us on X (formerly Twitter)"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>

      {/* Separator */}
      <div className="h-4 w-px bg-gray-600"></div>

      {/* Docs Link */}
      <Link
        href="/docs"
        className="flex items-center space-x-2 hover:text-gray-300 transition-colors"
        aria-label="View documentation"
      >
        <BookOpen className="h-4 w-4" />
        <span>Docs</span>
      </Link>
    </div>
  )
}

export default AuthFooter
