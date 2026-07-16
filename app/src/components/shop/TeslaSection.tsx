'use client'

import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

import { getImageUrl } from '@/lib'

interface Props {
  title: string
  subtitle: string
  image: string
  mobileImage?: string
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
  mobileImage,
  primaryButtonText,
  primaryButtonHref,
  onPrimaryClick,
  showScrollIndicator = false,
  priority = false,
}: Props) {
  return (
    <section className="tds-xs:h-[calc(100dvh-56px)] tds-lg:h-dvh tds-sm:pb-16 tds-lg:pb-24 relative flex h-[calc(100dvh-36px)] w-full snap-start flex-col items-center justify-end overflow-hidden pb-12">
      {/* Imagen de fondo a pantalla completa */}
      <div className="absolute inset-0 -z-10 h-full w-full">
        {mobileImage ? (
          <>
            <div className="tds-sm:hidden relative block h-full w-full">
              <Image
                fill
                alt={title}
                className="object-cover"
                priority={priority}
                sizes="100vw"
                src={getImageUrl(mobileImage)}
              />
            </div>
            <div className="tds-sm:block relative hidden h-full w-full">
              <Image
                fill
                alt={title}
                className="object-cover"
                priority={priority}
                sizes="100vw"
                src={getImageUrl(image)}
              />
            </div>
          </>
        ) : (
          <Image
            fill
            alt={title}
            className="object-cover"
            priority={priority}
            sizes="100vw"
            src={getImageUrl(image)}
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Contenedor Unificado (Textos + Botón) en la parte inferior */}
      <div className="relative z-10 flex w-full flex-col items-center px-4 text-center">
        {/* Título responsivo */}
        <motion.h2
          className="tds-sm:text-4xl tds-lg:text-6xl text-2xl font-bold tracking-tight text-white"
          initial={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {title}
        </motion.h2>

        {/* Subtítulo responsivo */}
        <motion.p
          className="tds-sm:text-lg tds-lg:text-2xl mx-auto mt-4 max-w-2xl text-sm leading-relaxed font-medium text-white/90"
          initial={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {subtitle}
        </motion.p>

        {/* Botón Único de Acción responsivo */}
        <motion.div
          className="tds-sm:mt-6 tds-lg:mt-8 mt-4 flex w-full justify-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {primaryButtonHref ? (
            <Link
              className="tds-sm:h-11 tds-lg:h-12 tds-sm:w-56 tds-lg:w-64 tds-sm:text-sm flex h-10 w-48 items-center justify-center rounded-md bg-white/70 text-xs font-semibold text-[#171A20] shadow-md backdrop-blur-md transition-all hover:bg-white/85"
              href={primaryButtonHref}
            >
              {primaryButtonText}
            </Link>
          ) : (
            <button
              className="tds-sm:h-11 tds-lg:h-12 tds-sm:w-56 tds-lg:w-64 tds-sm:text-sm flex h-10 w-48 cursor-pointer items-center justify-center rounded-md bg-white/70 text-xs font-semibold text-[#171A20] shadow-md backdrop-blur-md transition-all hover:bg-white/85"
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
