'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchResult {
  id: string
  type: 'post' | 'user'
  title: string
  subtitle: string
  avatar?: string
  username?: string
  content?: string
  token_symbol?: string
}

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}

export const SearchBar = ({ onSearch, placeholder = "Search", value, onChange }: SearchBarProps) => {
  const [internalQuery, setInternalQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Use controlled value if provided, otherwise use internal state
  const query = value !== undefined ? value : internalQuery

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      // Only search for users in instant dropdown
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=users`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    
    // Update state based on whether it's controlled or not
    if (onChange) {
      onChange(newValue)
    } else {
      setInternalQuery(newValue)
    }
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(newValue)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    } else if (e.key === 'Enter') {
      // Navigate to search page with posts
      if (query.trim()) {
        window.location.href = `/search?q=${encodeURIComponent(query.trim())}`
      }
    }
  }

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'user' && result.username) {
      window.location.href = `/profile/${result.username}`
    }
    setIsOpen(false)
    if (onChange) {
      onChange('')
    } else {
      setInternalQuery('')
    }
  }

  const clearSearch = () => {
    if (onChange) {
      onChange('')
    } else {
      setInternalQuery('')
    }
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsOpen(true)}
          className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-white" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-gray-700 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="text-gray-400">Searching...</div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 text-left"
                >
                  <div className="flex items-center space-x-3">
                    {result.avatar ? (
                      <img
                        src={result.avatar}
                        alt={result.title}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-400 text-sm font-medium">
                          {result.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">
                        {result.title}
                      </div>
                      <div className="text-gray-400 text-sm truncate">
                        {result.subtitle}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-4 text-center">
              <div className="text-gray-400">No results found</div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
