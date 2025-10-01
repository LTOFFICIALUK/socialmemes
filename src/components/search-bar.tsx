'use client'

import { useState, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}

export const SearchBar = ({ onSearch, placeholder = "Search", value, onChange }: SearchBarProps) => {
  const [internalQuery, setInternalQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Use controlled value if provided, otherwise use internal state
  const query = value !== undefined ? value : internalQuery

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    
    // Update state based on whether it's controlled or not
    if (onChange) {
      onChange(newValue)
    } else {
      setInternalQuery(newValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Navigate to search page with posts
      if (query.trim()) {
        window.location.href = `/search?q=${encodeURIComponent(query.trim())}`
      }
    }
  }

  const clearSearch = () => {
    if (onChange) {
      onChange('')
    } else {
      setInternalQuery('')
    }
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
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
    </div>
  )
}
