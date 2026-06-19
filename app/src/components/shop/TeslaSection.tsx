'use client'

import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

interface Props {
  title: string
  subtitle: string
  image: string
  primaryButtonText: string
  primaryButtonHref?: string
  onPrimaryClick?: () => void
  showScrollIndicator?: boolean
  priority?: boolean
}

export function TeslaSection({
  title,
  subtitle,
  image,
  primaryButtonText,
  primaryButtonHref,
  onPrimaryClick,
  showScrollIndicator = false,
  priority = false,
}: Props) {
  return (
    <section className="relative flex h-screen w-full snap-start flex-col items-center justify-end overflow-hidden pb-20">
      {/* Imagen de fondo a pantalla completa */}
      <div className="absolute inset-0 -z-10 h-full w-full">
        <Image
          fill
          alt={title}
          className="object-cover"
          priority={priority}
          sizes="100vw"
          src={image}
        />
        <div className="absolute inset-0 bg-black/20 dark:bg-black/35" />
      </div>

      {/* Contenedor Unificado (Textos + Botón) en la parte inferior */}
      <div className="relative z-10 flex w-full flex-col items-center px-4 text-center">
        {/* Título */}
        <motion.h2
          className="text-white text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          initial={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {title}
        </motion.h2>

        {/* Subtítulo */}
        <motion.p
          className="text-white/90 mx-auto mt-4 max-w-2xl text-lg leading-relaxed font-medium sm:text-xl sm:font-semibold lg:text-2xl"
          initial={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {subtitle}
        </motion.p>

        {/* Botón Único de Acción (Blanco Traslúcido Centrado) */}
        <motion.div
          className="mt-8 flex w-full justify-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {primaryButtonHref ? (
            <Link
              className="flex h-12 w-full items-center justify-center rounded-md bg-white/70 text-sm font-semibold text-[#171A20] shadow-md backdrop-blur-md transition-all hover:bg-white/85 sm:w-64"
              href={primaryButtonHref}
            >
              {primaryButtonText}
            </Link>
          ) : (
            <button
              className="flex h-12 w-full cursor-pointer items-center justify-center rounded-md bg-white/70 text-sm font-semibold text-[#171A20] shadow-md backdrop-blur-md transition-all hover:bg-white/85 sm:w-64"
              type="button"
              onClick={onPrimaryClick}
            >
              {primaryButtonText}
            </button>
          )}
        </motion.div>
      </div>

      {/* Indicador de Scroll en la base absoluta */}
      {showScrollIndicator && (
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            className="hidden text-white sm:block"
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-8 w-8" />
          </motion.div>
        </div>
      )}
    </section>
  )
}
