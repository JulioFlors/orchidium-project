'use client'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel, Navigation } from 'swiper/modules'

import { ProductGridItem } from './ProductGridItem'

import { Species } from '@/interfaces/'

// Swiper Styles
import 'swiper/css'
import 'swiper/css/navigation'

// Reutilizamos el CSS oficial del slideshow de productos
import '../slideshow/slideshow.css'

interface Props {
  products: Species[]
}

export function ProductSlideshow({ products }: Props) {
  return (
    <div className="main-swiper-interactive-area w-full select-none">
      <Swiper
        grabCursor
        loop
        navigation
        breakpoints={{
          1024: {
            slidesPerView: 3.15,
            spaceBetween: 24,
          },
        }}
        className="w-full"
        modules={[Mousewheel, Navigation]}
        mousewheel={{
          forceToAxis: true,
        }}
        slidesPerView={1.15}
        spaceBetween={16}
        style={
          {
            '--swiper-navigation-color': '#ffffff',
            '--swiper-navigation-size': '18px',
            '--swiper-navigation-sides-offset': '10px',
          } as React.CSSProperties
        }
      >
        {products.map((product, i) => (
          <SwiperSlide key={product.slug} className="!h-auto !items-stretch !justify-start">
            <div className="flex h-full w-full flex-col">
              <ProductGridItem index={i} product={product} showGlow={false} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
