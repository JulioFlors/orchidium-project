import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { Category } from '@/interfaces'
import { useUIStore } from '@/store'

interface SubcategoryContentProps {
  categoryId: string
  categories: Category[]
}

export function SubcategoryContent({ categoryId, categories }: SubcategoryContentProps) {
  const closeMenu = useUIStore((state) => state.closeSideMenu)

  const activeCategory = useUIStore((state) => state.activeCategory)
  const category = categories.find((cat) => cat.id === activeCategory)

  if (!category || !category.subcategories) return null

  return (
    <div className="lg-small:hidden relative w-full">
      <div className="mb-5 pb-2 text-2xl font-bold">{category.title}</div>
      <div className="grid w-full grid-cols-1 gap-2.5">
        {category.subcategories.map((subcategory) => (
          <Link
            key={subcategory.id}
            className="focus-sidebar-img block"
            href={subcategory.url}
            onClick={closeMenu}
          >
            <div className="overflow-hidden rounded">
              <div className="relative aspect-video h-42 w-full">
                <Image
                  fill
                  alt={subcategory.title}
                  className="rounded object-cover"
                  src={subcategory.image || '/placeholder.svg'}
                />
              </div>
            </div>
            <div className="pt-2 pb-2.5 text-center text-lg leading-5 font-semibold">
              {subcategory.title}
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-2.5 mb-8 w-full">
        <Link
          className="btn-secondary focus-btn-secondary block"
          href={`/category/${categoryId}`}
          onClick={closeMenu}
        >
          Ver todo
        </Link>
      </div>
    </div>
  )
}
