'use client'

import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, FreeMode, Pagination } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/free-mode'
import 'swiper/css/pagination'

import './slideshow.css'
import { StockLabel } from '@/components'

interface Props {
  isAvailable: boolean
  className?: string
  images: string[]
  title: string
}

export function MobileSlideshow({ isAvailable, className, images, title }: Props) {
  return (
    <div className={`${className} relative`}>
      <Swiper
        pagination
        autoplay={{
          delay: 8000,
        }}
        className="aspect-square"
        modules={[Autoplay, FreeMode, Pagination]}
        style={
          {
            width: '100%',
            height: '100%',
            minWidth: '264px',
            minHeight: '264px',
            '--swiper-pagination-color': 'var(--color-secondary)',
          } as React.CSSProperties
        }
      >
        {images.map((image) => (
          <SwiperSlide key={image}>
            <Image
              alt={title}
              className="object-cover"
              height={2000}
              src={`/plants/${image}`}
              width={2000}
            />

            {/* Etiqueta de Agotado para Mobile Slideshow */}
            {!isAvailable && <StockLabel MobileSlideshow />}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
