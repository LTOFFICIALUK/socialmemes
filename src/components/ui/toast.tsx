'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const toastStyles = {
  success: 'bg-green-600 border-green-500',
  error: 'bg-red-600 border-red-500',
  warning: 'bg-yellow-600 border-yellow-500',
  info: 'bg-blue-600 border-blue-500',
}

export const Toast = ({ id, type, title, message, duration = 4000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  
  const Icon = toastIcons[type]

  const handleClose = useCallback(() => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose(id)
    }, 300) // Match animation duration
  }, [onClose, id])

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    // Auto close
    const autoCloseTimer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => {
      clearTimeout(timer)
      clearTimeout(autoCloseTimer)
    }
  }, [duration, handleClose])

  return (
    <div
      className={cn(
        "flex items-start space-x-3 p-4 rounded-lg border shadow-lg max-w-sm w-full transform transition-all duration-300 ease-in-out",
        toastStyles[type],
        isVisible && !isLeaving ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <Icon className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">
          {title}
        </p>
        {message && (
          <p className="text-sm text-white/90 mt-1">
            {message}
          </p>
        )}
      </div>
      <button
        onClick={handleClose}
        className="text-white/80 hover:text-white transition-colors flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Array<ToastProps & { id: string }>
  onClose: (id: string) => void
}

export const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onClose}
        />
      ))}
    </div>
  )
}

// Toast Hook
interface ToastOptions {
  type: ToastType
  title: string
  message?: string
  duration?: number
}

let toastId = 0

export const useToast = () => {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([])

  const addToast = ({ type, title, message, duration }: ToastOptions) => {
    const id = (++toastId).toString()
    const newToast = { id, type, title, message, duration, onClose: () => {} }
    
    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const success = (title: string, message?: string) => 
    addToast({ type: 'success', title, message })
  
  const error = (title: string, message?: string) => 
    addToast({ type: 'error', title, message })
  
  const warning = (title: string, message?: string) => 
    addToast({ type: 'warning', title, message })
  
  const info = (title: string, message?: string) => 
    addToast({ type: 'info', title, message })

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }
}
