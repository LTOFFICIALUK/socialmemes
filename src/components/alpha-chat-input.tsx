'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'

interface AlphaChatInputProps {
  ownerId: string
  onMessageSent: () => void
}

export const AlphaChatInput = ({ ownerId, onMessageSent }: AlphaChatInputProps) => {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || isLoading) return

    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/alpha-chat/${ownerId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      setContent('')
      onMessageSent()
    } catch (error) {
      console.error('Error sending alpha message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="border-t border-gray-800 p-4">
      <form onSubmit={handleSubmit} className="flex space-x-3">
        <div className="flex-1">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your alpha insights..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          disabled={!content.trim() || isLoading}
          className="bg-green-600 hover:bg-green-700 text-white px-4"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}
