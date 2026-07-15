'use client'

import { Swiper, SwiperSlide } from 'swiper/react'
import { FreeMode, Mousewheel, Navigation } from 'swiper/modules'

import { ProductGridItem } from './ProductGridItem'

import { Species } from '@/interfaces/'

// Swiper Styles
import 'swiper/css'
import 'swiper/css/free-mode'
import 'swiper/css/navigation'

// Reutilizamos el CSS oficial del slideshow de productos
import '../slideshow/slideshow.css'

interface Props {
  products: Species[]
}

export function ProductSlideshow({ products }: Props) {
  return (
    <div className="main-swiper-interactive-area w-full select-none py-6">
      <Swiper
        className="w-full"
        freeMode={true}
        grabCursor={true}
        navigation={true}
        modules={[FreeMode, Mousewheel, Navigation]}
        mousewheel={{
          forceToAxis: true,
        }}
        slidesPerView={1.25}
        spaceBetween={16}
        breakpoints={{
          1024: {
            slidesPerView: 3.3,
            spaceBetween: 24,
          },
        }}
        style={
          {
            '--swiper-navigation-color': 'var(--color-dark, #171A20)',
            '--swiper-navigation-size': '18px',
            '--swiper-navigation-sides-offset': '10px',
          } as React.CSSProperties
        }
      >
        {products.map((product, i) => (
          <SwiperSlide key={product.slug} className="!h-auto !items-stretch !justify-start">
            <div className="w-full h-full flex flex-col">
              <ProductGridItem index={i} product={product} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
