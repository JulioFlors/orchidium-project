'use client'

import type { Swiper as SwiperClass } from 'swiper'

import { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Keyboard, Pagination } from 'swiper/modules'
import Image from 'next/image'
import Link from 'next/link'

import { getImageUrl } from '@/lib'

// Swiper Styles
import 'swiper/css'
import 'swiper/css/pagination'

interface Slide {
  title: string
  subtitle: string
  image: string
  mobileImage?: string
  href: string
}

interface Props {
  slides: Slide[]
}

export function HeroSlideshow({ slides }: Props) {
  // Referencia para controlar la instancia de Swiper directamente
  const swiperRef = useRef<SwiperClass | null>(null)

  return (
    <section
      className="relative h-dvh w-full overflow-hidden"
      // Control manual de Autoplay en Hover para garantizar detección sobre textos y botones
      onMouseEnter={() => {
        if (swiperRef.current && swiperRef.current.autoplay) {
          swiperRef.current.autoplay.stop()
        }
      }}
      onMouseLeave={() => {
        if (swiperRef.current && swiperRef.current.autoplay) {
          swiperRef.current.autoplay.start()
        }
      }}
    >
      <Swiper
        loop
        autoplay={{
          delay: 10000,
          disableOnInteraction: false,
        }}
        // Habilitar loop para que el retorno del último al primer slide sea continuo y fluido
        className="hero-swiper h-full w-full"
        keyboard={{
          enabled: true,
          onlyInViewport: true,
        }}
        modules={[Autoplay, Keyboard, Pagination]}
        pagination={{
          clickable: true,
        }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.href} className="relative h-full w-full">
            {/* Imagen de fondo a pantalla completa */}
            <div className="absolute inset-0 -z-10 h-full w-full">
              {slide.mobileImage ? (
                <>
                  <div className="tds-sm:hidden relative block h-full w-full">
                    <Image
                      fill
                      alt={slide.title}
                      className="object-cover"
                      loading={index === 0 ? 'eager' : 'lazy'}
                      priority={index === 0}
                      sizes="100vw"
                      src={getImageUrl(slide.mobileImage)}
                    />
                  </div>
                  <div className="tds-sm:block relative hidden h-full w-full">
                    <Image
                      fill
                      alt={slide.title}
                      className="object-cover"
                      loading={index === 0 ? 'eager' : 'lazy'}
                      priority={index === 0}
                      sizes="100vw"
                      src={getImageUrl(slide.image)}
                    />
                  </div>
                </>
              ) : (
                <Image
                  fill
                  alt={slide.title}
                  className="object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  priority={index === 0}
                  sizes="100vw"
                  src={getImageUrl(slide.image)}
                />
              )}
              <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Contenido centrado en la parte inferior con padding responsivo */}
            <div className="tds-xs:pb-10 tds-sm:pb-16 tds-lg:pb-24 flex h-full w-full flex-col items-center justify-end pb-8">
              <div className="relative z-10 flex w-full flex-col items-center px-4 text-center">
                {/* Título responsivo optimizado para zoom y pantallas pequeñas */}
                <h2 className="text-lg font-bold tracking-tight text-white tds-xs:text-xl tds-sm:text-3xl tds-lg:text-5xl">
                  {slide.title}
                </h2>

                {/* Subtítulo si existe */}
                {slide.subtitle && (
                  <p className="mx-auto mt-2 max-w-2xl text-xs font-medium leading-relaxed text-white/90 tds-xs:text-sm tds-sm:mt-3 tds-sm:text-base tds-lg:mt-4 tds-lg:text-lg">
                    {slide.subtitle}
                  </p>
                )}

                {/* Botón Único de Acción responsivo */}
                <div className="mt-3 flex w-full justify-center tds-xs:mt-4 tds-sm:mt-6 tds-lg:mt-8">
                  <Link
                    className="flex h-8.5 w-full max-w-40 items-center justify-center rounded-md bg-white/70 text-[11px] font-semibold text-[#171A20] shadow-md backdrop-blur-md transition-all hover:bg-white/85 tds-xs:h-9 tds-xs:w-44 tds-xs:text-xs tds-sm:h-10 tds-sm:w-48 tds-lg:h-11 tds-lg:w-56 tds-lg:text-sm"
                    href={slide.href}
                  >
                    Comprar ahora
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}
