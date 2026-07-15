'use client'

import { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Keyboard, Pagination } from 'swiper/modules'
import type { Swiper as SwiperClass } from 'swiper'
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
        autoplay={{
          delay: 10000,
          disableOnInteraction: false,
        }}
        className="hero-swiper h-full w-full"
        keyboard={{
          enabled: true,
          onlyInViewport: true,
        }}
        // Habilitar loop para que el retorno del último al primer slide sea continuo y fluido
        loop={true}
        modules={[Autoplay, Keyboard, Pagination]}
        pagination={{
          clickable: true,
        }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index} className="relative h-full w-full">
            {/* Imagen de fondo a pantalla completa */}
            <div className="absolute inset-0 -z-10 h-full w-full">
              {slide.mobileImage ? (
                <>
                  <div className="block tds-sm:hidden relative h-full w-full">
                    <Image
                      fill
                      alt={slide.title}
                      className="object-cover"
                      priority={index === 0}
                      sizes="100vw"
                      src={getImageUrl(slide.mobileImage)}
                    />
                  </div>
                  <div className="hidden tds-sm:block relative h-full w-full">
                    <Image
                      fill
                      alt={slide.title}
                      className="object-cover"
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
                  priority={index === 0}
                  sizes="100vw"
                  src={getImageUrl(slide.image)}
                />
              )}
              <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Contenido centrado en la parte inferior con padding responsivo */}
            <div className="flex h-full w-full flex-col items-center justify-end pb-12 tds-sm:pb-16 tds-lg:pb-24">
              <div className="relative z-10 flex w-full flex-col items-center px-4 text-center">
                {/* Título responsivo optimizado para zoom extremo */}
                <h2 className="text-2xl font-bold tracking-tight text-white tds-sm:text-4xl tds-lg:text-6xl">
                  {slide.title}
                </h2>

                {/* Botón Único de Acción responsivo */}
                <div className="mt-4 tds-sm:mt-6 tds-lg:mt-8 flex w-full justify-center">
                  <Link
                    className="flex h-10 tds-sm:h-11 tds-lg:h-12 w-48 tds-sm:w-56 tds-lg:w-64 items-center justify-center rounded-md bg-white/70 text-xs tds-sm:text-sm font-semibold text-[#171A20] shadow-md backdrop-blur-md transition-all hover:bg-white/85"
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
