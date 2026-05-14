'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoInformationCircleOutline,
  IoWarningOutline,
  IoCloseOutline,
} from 'react-icons/io5'
import { clsx } from 'clsx'

import { useToastStore, type ToastType } from '@/store/toast/toast.store'
import { StatusCircleIcon, type GlowVariant } from '@/components'

interface ToastProps {
  id: string
  message: string
  type: ToastType
}

const TOAST_CONFIG: Record<
  ToastType,
  {
    icon: React.ReactNode
    glowVariant: GlowVariant
    gradientBorder: string
    spotlight: string
    iconColor: string
  }
> = {
  success: {
    icon: <IoCheckmarkCircleOutline />,
    glowVariant: 'green',
    gradientBorder: 'via-green-500/10 to-green-500/50',
    spotlight: 'bg-green-500/10 group-hover:bg-green-500/20',
    iconColor: 'text-green-500',
  },
  error: {
    icon: <IoAlertCircleOutline />,
    glowVariant: 'red',
    gradientBorder: 'via-red-500/10 to-red-500/50',
    spotlight: 'bg-red-500/10 group-hover:bg-red-500/20',
    iconColor: 'text-red-500',
  },
  info: {
    icon: <IoInformationCircleOutline />,
    glowVariant: 'blue',
    gradientBorder: 'via-blue-500/10 to-blue-500/50',
    spotlight: 'bg-blue-500/10 group-hover:bg-blue-500/20',
    iconColor: 'text-blue-500',
  },
  warning: {
    icon: <IoWarningOutline />,
    glowVariant: 'orange',
    gradientBorder: 'via-amber-500/10 to-amber-500/50',
    spotlight: 'bg-amber-500/10 group-hover:bg-amber-500/20',
    iconColor: 'text-amber-500',
  },
}

export function Toast({ id, message, type }: ToastProps) {
  const { removeToast } = useToastStore()
  const [timeLeft, setTimeLeft] = useState(10000) // 10 segundos iniciales
  const [isPaused, setIsPaused] = useState(false)
  const config = TOAST_CONFIG[type]

  const handlePause = useCallback(() => setIsPaused(true), [])
  const handleResume = useCallback(() => {
    setIsPaused(false)
    setTimeLeft(10000) // Reiniciar a 10 segundos al perder foco/hover
  }, [])

  // Orquestador del tiempo: solo decrementa.
  // Optimizamos eliminando timeLeft de dependencias para evitar recrear el intervalo cada 100ms.
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 100 : 0))
    }, 100)

    return () => clearInterval(interval)
  }, [isPaused])

  // Orquestador de salida: ejecuta la remoción fuera del ciclo de actualización de timeLeft
  useEffect(() => {
    if (timeLeft <= 0) {
      removeToast(id)
    }
  }, [timeLeft, id, removeToast])

  return (
    <motion.div
      layout
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="group pointer-events-auto relative overflow-hidden rounded-xl p-px shadow-xl transition-all duration-300 hover:shadow-2xl"
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      role="alert"
      onBlur={handleResume}
      onFocus={handlePause}
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
    >
      {/* Capa de Borde Degradado */}
      <div
        className={clsx(
          'pointer-events-none absolute inset-0 bg-linear-to-tr from-transparent transition-opacity duration-500',
          config.gradientBorder,
        )}
      />

      {/* Contenido Principal */}
      <div className="bg-surface relative flex items-center gap-4 rounded-[inherit] px-4 py-3.5 backdrop-blur-md">
        {/* Efecto Spotlight (Reflector) */}
        <div
          className={clsx(
            'pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl transition-all duration-500 group-hover:blur-3xl',
            config.spotlight,
          )}
        />

        <StatusCircleIcon
          className="relative z-10 shrink-0"
          colorClassName={config.iconColor}
          glowVariant={config.glowVariant}
          icon={config.icon}
          size="sm"
          variant="glow"
        />

        <p className="text-primary relative z-10 flex-1 text-sm leading-tight font-medium">
          {message}
        </p>

        <button
          aria-label="Cerrar notificación"
          className="text-primary hover:bg-hover-overlay focus-visible:ring-accessibility relative z-10 cursor-pointer rounded-full p-1.5 transition-colors outline-none! focus-visible:ring-2"
          type="button"
          onClick={() => removeToast(id)}
        >
          <IoCloseOutline className="h-5 w-5" />
        </button>
      </div>
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
