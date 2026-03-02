'use client'
import { clsx } from 'clsx'
import { motion, useAnimation, Transition } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

/** Props del componente BorderTrail
 * Ajusta los valores para personalizar la animación de los bordes.
 */
type BorderTrailProps = {
  /** Clase personalizada para el trail. */
  className?: string
  /** Longitud visual del cometa number (px) o string (%). */
  size?: number | string
  /** Configuración de la transición que sobreescribe la base. */
  transition?: Transition
  /** Retraso inicial de la animación (en segundos). */
  delay?: number
  /** Callback al terminar la animación. */
  onCompleteAction?: () => void
  /** Estilos adicionales inline. */
  style?: React.CSSProperties
  /** Estado de activación (true = inicia la animación). */
  active?: boolean
  /** Duración total de la animación base (en segundos). */
  duration?: number
  /** Radio de las esquinas del borde (en píxeles). Debe coincidir con el border-radius del contenedor padre. */
  trackRadius?: number
  /** Color del trail (HEX). */
  color?: string
  /** Si la card está seleccionada permanentemente. */
  isSelected?: boolean
}

export function BorderTrail({
  className,
  size = '80%',
  transition: userTransition,
  delay = 0,
  onCompleteAction,
  style,
  active = false,
  duration = 0.8,
  trackRadius = 6, // rounded-md
  color = '#fff',
  isSelected = false,
}: BorderTrailProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [])

  const controls = useAnimation()

  // Perímetro y centro superior
  const perimeter = dimensions.width > 0 ? 2 * (dimensions.width + dimensions.height) : 0
  const centerTopOffset = perimeter > 0 ? (dimensions.width / 2 / perimeter) * 100 : 14.5
  const finalOffsetDistance = 100 + centerTopOffset

  // Longitud dinámica: +30% si está seleccionada (para destacar sobre el hover normal)
  const dynamicSize = isSelected ? '110%' : size

  const targetWidth = dimensions.width > 0 ? `${dimensions.width}px` : '100%'
  const targetHeight =
    dimensions.height > 0 ? `${Math.min(dimensions.width, dimensions.height * 0.4)}px` : '70%'

  /**
   * ANIMACIÓN IMPERATIVA (Framer Motion)
   * En lugar de usar `variants` declarativas, utilizamos `useAnimation`.
   * Esto nos permite dictar exactamente qué propiedades animar cuando pierde el hover (opacity 0),
   * congelando "mágicamente" el cometa en su posición actual sin rebobinados.
   */
  const prevActiveRef = useRef(active)

  useEffect(() => {
    // Si aún no tenemos dimensiones del contenedor, no hacemos nada
    if (dimensions.width === 0) return
    // Prevenir reinicios molestos si el efecto se dispara por un Resize en lugar de un Hover
    if (prevActiveRef.current === active) return

    prevActiveRef.current = active

    if (active) {
      // ESTADO ACTIVO: Nacimiento y Recorrido
      // Al proporcionar un array [inicio, fin], forzamos a Framer Motion a reiniciar SIEMPRE
      // la animación desde el punto inicial estipulado (`centerTopOffset`).
      controls.start({
        opacity: 1,
        offsetDistance: [`${centerTopOffset}%`, `${finalOffsetDistance}%`],
        width: [size, '60%', targetWidth],
        height: [size, '60%', targetHeight],
        transition: {
          opacity: { duration: 0.1 },
          offsetDistance: {
            delay,
            duration: duration, // Tiempo de recorrer la caja
            ease: 'circInOut',
            repeat: 0, // Una sola vuelta exacta
            ...userTransition,
          },
          width: { duration: duration * 0.8, ease: 'circOut', delay: delay },
          height: { duration: duration * 0.8, ease: 'circOut', delay: delay },
        },
      })
    } else {
      // ESTADO INACTIVO: Fade-out estático
      // Al SOLAMENTE instruir un cambio en la opacidad (y omitir offset, width, height),
      // Framer Motion "congela" el rastro exactamente donde fue interrumpido y lo desvanece.
      controls.start({
        opacity: 0,
        transition: { duration: 0.5, ease: 'easeOut' },
      })
    }
  }, [
    active,
    controls,
    centerTopOffset,
    finalOffsetDistance,
    size,
    targetWidth,
    targetHeight,
    duration,
    delay,
    userTransition,
    dimensions.width,
  ])

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

    return result
      ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
      : '255 255 255'
  }

  const rgbColor = hexToRgb(color)

  return (
    <div
      ref={containerRef}
      className={clsx(
        'pointer-events-none absolute inset-0 rounded-md border border-transparent',
        '[mask-clip:padding-box,border-box]',
        'mask-intersect',
        'mask-[linear-gradient(transparent,transparent),linear-gradient(#000,#000)]',
      )}
    >
      <motion.div
        animate={controls}
        className={clsx('absolute', className)}
        // ESTADO INICIAL: anclado al centro
        initial={{ offsetDistance: `${centerTopOffset}%`, opacity: 0 }}
        style={{
          width: dynamicSize,
          height: dynamicSize,
          offsetPath: `rect(0 100% 100% 0 round ${trackRadius}px)`,
          maskImage:
            'linear-gradient(to right, transparent 0%, black 40%, black 60%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 40%, black 60%, transparent 100%)',
          backgroundColor: color,
          boxShadow: `
            0px 0px 60px 30px rgb(${rgbColor} / 80%),
            0 0 100px 60px rgb(${rgbColor} / 50%),
            0 0 140px 90px rgb(${rgbColor} / 30%)
          `,
          ...style,
        }}
        onAnimationComplete={onCompleteAction}
      />
    </div>
  )
}
