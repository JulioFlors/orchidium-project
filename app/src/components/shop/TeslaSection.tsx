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
    <section className="tds-xs:h-[calc(100dvh-56px)] tds-lg:h-dvh tds-xs:pb-10 tds-sm:pb-16 tds-lg:pb-24 relative flex h-[calc(100dvh-36px)] w-full snap-start flex-col items-center justify-end overflow-hidden pb-8">
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
          className="text-lg font-bold tracking-tight text-white tds-xs:text-xl tds-sm:text-3xl tds-lg:text-5xl"
          initial={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {title}
        </motion.h2>

        {/* Subtítulo responsivo */}
        <motion.p
          className="mx-auto mt-2 max-w-2xl text-xs font-medium leading-relaxed text-white/90 tds-xs:text-sm tds-sm:mt-3 tds-sm:text-base tds-lg:mt-4 tds-lg:text-lg"
          initial={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {subtitle}
        </motion.p>

        {/* Botón Único de Acción responsivo */}
        <motion.div
          className="mt-3 flex w-full justify-center tds-xs:mt-4 tds-sm:mt-6 tds-lg:mt-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {primaryButtonHref ? (
            <Link
              className="flex h-8.5 w-full max-w-40 items-center justify-center rounded-md bg-white/70 text-[11px] font-semibold text-[#171A20] shadow-md backdrop-blur-md transition-all hover:bg-white/85 tds-xs:h-9 tds-xs:w-44 tds-xs:text-xs tds-sm:h-10 tds-sm:w-48 tds-lg:h-11 tds-lg:w-56 tds-lg:text-sm"
              href={primaryButtonHref}
            >
              {primaryButtonText}
            </Link>
          ) : (
            <button
              className="flex h-8.5 w-full max-w-40 cursor-pointer items-center justify-center rounded-md bg-white/70 text-[11px] font-semibold text-[#171A20] shadow-md backdrop-blur-md transition-all hover:bg-white/85 tds-xs:h-9 tds-xs:w-44 tds-xs:text-xs tds-sm:h-10 tds-sm:w-48 tds-lg:h-11 tds-lg:w-56 tds-lg:text-sm"
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
