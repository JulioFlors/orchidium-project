import React, { type ReactNode } from 'react'
import { clsx } from 'clsx'

interface HeadingProps {
  /** Título principal de la sección o vista */
  title: string
  /** Descripción o subtítulo opcional */
  description?: ReactNode
  /** Slot para acciones a la derecha (ej: Botón, DeviceStatus, etc.) */
  action?: ReactNode
  /** Clases adicionales para el contenedor principal */
  className?: string
}

/**
 * Heading - Componente de título con esteroides para vistas y secciones.
 * Implementa el patrón responsivo industrial de PristinoPlant:
 * - Desktop (tds-sm): Título a la izquierda, Acción a la derecha (alineado al fondo).
 * - Mobile: Título y Acción en stack vertical.
 */
export function Heading({ title, description, action, className }: HeadingProps) {
  return (
    <div
      className={clsx(
        'tds-sm:flex-row tds-sm:items-end tds-sm:justify-between tds-sm:gap-8 flex flex-col gap-4',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <h1 className="text-primary truncate text-2xl leading-10.5 font-bold tracking-tight antialiased">
          {title}
        </h1>
        {description && (
          <div className="text-secondary mt-1 max-w-2xl text-sm leading-relaxed opacity-80">
            {description}
          </div>
        )}
      </div>

      {action && <div className="tds-sm:w-auto w-full shrink-0">{action}</div>}
    </div>
  )
}
