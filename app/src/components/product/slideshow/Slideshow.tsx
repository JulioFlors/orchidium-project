'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Swiper as SwiperObject } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, FreeMode, Keyboard, Navigation, Pagination, Thumbs } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/free-mode'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/thumbs'

import './slideshow.css'
import { StockLabel } from '@/components'

interface Props {
  isAvailable: boolean
  className?: string
  images: string[]
  title: string
}

export function Slideshow({ isAvailable, className, images, title }: Props) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperObject>()

  return (
    // Contenedor general del slideshow
    <div className={`${className || ''}`}>
      {/* Área interactiva SOLO para el Swiper principal */}
      <div className="main-swiper-interactive-area">
        <Swiper
          keyboard
          navigation
          autoplay={{
            delay: 8000,
          }}
          className="aspect-square rounded"
          modules={[Autoplay, FreeMode, Keyboard, Navigation, Pagination, Thumbs]}
          pagination={{ clickable: true }} // Swiper genera .swiper-pagination
          spaceBetween={0}
          style={
            {
              '--swiper-navigation-color': 'var(--color-light)',
              '--swiper-pagination-color': 'var(--color-dark)',
              '--swiper-pagination-bullet-inactive-opacity': '0.3',

              '--swiper-pagination-bottom': '36px',

              '--swiper-navigation-size': '18px',
              '--swiper-navigation-sides-offset': '18px',
            } as React.CSSProperties
          }
          thumbs={{
            swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
          }}
        >
          {images.map((image, index) => (
            <SwiperSlide key={image}>
              <Image
                alt={title}
                className="object-cover"
                height={2000}
                priority={index === 0}
                src={`/plants/${image}`}
                width={2000}
              />

              {/* Etiqueta de Agotado para Desktop Slideshow */}
              {!isAvailable && <StockLabel Slideshow />}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Swiper para los thumbnails */}
      {images.length > 1 && (
        <Swiper
          freeMode
          watchSlidesProgress
          className="thumbs-swiper"
          modules={[FreeMode, Thumbs]}
          slidesPerView={5}
          spaceBetween={10}
          onSwiper={setThumbsSwiper}
        >
          {images.map((image) => (
            <SwiperSlide key={`thumb-${image}`} className="aspect-square">
              <Image
                priority
                alt={`${title} thumbnail`}
                className="rounded object-cover"
                height={1000}
                src={`/plants/${image}`}
                width={1000}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  )
}
