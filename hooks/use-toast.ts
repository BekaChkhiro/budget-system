'use client'

import { useState, useCallback } from 'react'

interface Toast {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const [toasts, setToasts] = useState<(Toast & { id: string })[]>([])

  const toast = useCallback((toast: Toast) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)

    // For now, just console.log the toast
    console.log(`Toast: ${toast.title}`, toast.description)
  }, [])

  return {
    toast,
    toasts
  }
}