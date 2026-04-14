'use client'

import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface StatusCircleIconProps {
  icon: React.ReactNode
  variant?: 'canvas' | 'surface' | 'vibrant'
  colorClassName?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-8 w-8 text-lg',
  md: 'h-10 w-10 text-xl',
  lg: 'h-12 w-12 text-2xl',
}

export function StatusCircleIcon({
  icon,
  variant = 'canvas',
  colorClassName,
  className,
  size = 'md',
}: StatusCircleIconProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border shadow-sm transition-all',
        sizeClasses[size],
        variant === 'canvas' && 'bg-canvas border-input-outline',
        variant === 'surface' && 'bg-surface border-input-outline',
        variant === 'vibrant' && 'bg-hover-overlay border-transparent',
        colorClassName,
        className,
      )}
    >
      {icon}
    </div>
  )
}
