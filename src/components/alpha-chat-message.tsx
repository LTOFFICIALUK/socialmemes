'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlphaChatMessage } from '@/lib/database'

interface AlphaChatMessageProps {
  message: AlphaChatMessage
}

export const AlphaChatMessageComponent = ({ message }: AlphaChatMessageProps) => {
  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={message.profiles.avatar_url || ''} alt={message.profiles.username} />
          <AvatarFallback className="bg-gray-800 text-white">
            {message.profiles.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-white">{message.profiles.username}</span>
            <span className="text-gray-400 text-sm">
              {new Date(message.created_at).toLocaleDateString()}
            </span>
          </div>
          {message.content && (
            <p className="text-gray-300 mb-2">{message.content}</p>
          )}
          {message.image_url && (
            <img
              src={message.image_url}
              alt="Alpha message"
              className="rounded-lg max-w-full h-auto"
            />
          )}
          {message.token_symbol && (
            <div className="mt-2 p-2 bg-gray-800 rounded-lg">
              <span className="text-green-400 font-semibold">${message.token_symbol}</span>
              {message.token_name && (
                <span className="text-gray-400 ml-2">{message.token_name}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
