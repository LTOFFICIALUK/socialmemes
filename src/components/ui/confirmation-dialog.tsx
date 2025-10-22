'use client'

import { Button } from './button'
import { cn } from '@/lib/utils'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  isLoading?: boolean
  showInput?: boolean
  inputPlaceholder?: string
  inputValue?: string
  onInputChange?: (value: string) => void
}

export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
  showInput = false,
  inputPlaceholder = '',
  inputValue = '',
  onInputChange
}: ConfirmationDialogProps) => {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-20 lg:pb-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-black border border-gray-700 rounded-lg shadow-xl max-w-md w-full max-h-[calc(100vh-8rem)] lg:max-h-[90vh] overflow-y-auto"
        onClick={handleDialogClick}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            {title}
          </h3>
          <p className="text-gray-300 mb-6">
            {message}
          </p>
          
          {showInput && (
            <div className="mb-6">
              <textarea
                value={inputValue}
                onChange={(e) => onInputChange?.(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder={inputPlaceholder}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isLoading}
                autoFocus
              />
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              disabled={isLoading}
              className="text-gray-400 hover:text-white bg-black border border-gray-700 hover:border-gray-600"
            >
              {cancelText}
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onConfirm()
              }}
              disabled={isLoading || (showInput && !inputValue?.trim())}
              className={cn(
                "px-6",
                variant === 'destructive' 
                  ? "bg-red-600 hover:bg-red-700 text-white" 
                  : "bg-green-600 hover:bg-green-700 text-white"
              )}
            >
              {isLoading ? 'Loading...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
