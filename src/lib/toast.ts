"use client"

import { toast as sonnerToast } from 'sonner'

interface ToastOptions {
  description?: string
}

function toast(message: string, options?: ToastOptions) {
  sonnerToast(message, { description: options?.description })
}

toast.success = (message: string, options?: ToastOptions) => {
  sonnerToast.success(message, { description: options?.description })
}

toast.error = (message: string, options?: ToastOptions) => {
  sonnerToast.error(message, { description: options?.description })
}

toast.warning = (message: string, options?: ToastOptions) => {
  sonnerToast(message, {
    description: options?.description,
    className: 'bg-amber-50 border-amber-200',
  })
}

export { toast }
