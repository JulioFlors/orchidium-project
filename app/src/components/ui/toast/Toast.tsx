'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  IoCheckmarkCircle,
  IoAlertCircle,
  IoInformationCircle,
  IoWarning,
  IoClose,
} from 'react-icons/io5'
import { clsx } from 'clsx'

import { useToastStore, type ToastType } from '@/store/toast/toast.store'

interface ToastProps {
  id: string
  message: string
  type: ToastType
}

const TOAST_CONFIG = {
  success: {
    icon: <IoCheckmarkCircle className="h-5 w-5 text-emerald-500" />,
    className: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  },
  error: {
    icon: <IoAlertCircle className="h-5 w-5 text-red-500" />,
    className: 'border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-400',
  },
  info: {
    icon: <IoInformationCircle className="h-5 w-5 text-blue-500" />,
    className: 'border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-400',
  },
  warning: {
    icon: <IoWarning className="h-5 w-5 text-amber-500" />,
    className: 'border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  },
}

export function Toast({ id, message, type, duration = 4000 }: ToastProps & { duration?: number }) {
  const { removeToast } = useToastStore()
  const [isPaused, setIsPaused] = useState(false)
  const config = TOAST_CONFIG[type]

  useEffect(() => {
    if (duration <= 0 || isPaused) return

    const timer = setTimeout(() => {
      removeToast(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, isPaused, removeToast])

  return (
    <motion.div
      layout
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={clsx(
        'group relative flex items-center gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all',
        config.className,
      )}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="shrink-0">{config.icon}</div>
      <p className="flex-1 text-sm leading-tight font-medium">{message}</p>
      <button
        className="text-primary/20 hover:text-primary/50 -mr-1 rounded-full p-1 transition-colors"
        type="button"
        onClick={() => removeToast(id)}
      >
        <IoClose className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const { toasts } = useToastStore()

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-9999 flex w-full max-w-[400px] flex-col gap-3 p-4 sm:right-8 sm:bottom-8">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
