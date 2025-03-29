'use client'

import Link from 'next/link'
import { IoChevronForwardOutline } from 'react-icons/io5'

import { Searchbox } from '@/components'
import { Category, Subcategory } from '@/interfaces'
import { useUIStore } from '@/store'

interface MainContentProps {
  searchResults: (Subcategory | Category)[]
  categories: Category[]
}

export function MainContent({ searchResults, categories }: MainContentProps) {
  const closeMenu = useUIStore((state) => state.closeSideMenu)
  const setActiveCategory = useUIStore((state) => state.setActiveCategory)

  return (
    <>
      <div className="lg-small:hidden relative w-full">
        <Searchbox searchResults={searchResults} />
      </div>

      <div className="w-full" id="renderMainContent">
        {categories.map((category) => (
          <div key={category.id} className="mb-2">
            {category.subcategories ? (
              <div className="lg-small:hidden relative">
                <button
                  className="focus-sidebar-content group hover:bg-hover mb-2 flex w-full items-center justify-between rounded px-3 py-2 font-medium text-black transition-colors duration-300"
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                >
                  <span>{category.title}</span>
                  <span className="text-secondary group-hover:text-primary transition-colors duration-300">
                    <IoChevronForwardOutline size={16} />
                  </span>
                </button>
              </div>
            ) : (
              <Link
                className="focus-sidebar-content hover:bg-hover mb-2 flex items-center justify-between rounded p-2 font-medium text-black transition-colors duration-300"
                href={category.url || '#'}
                onClick={closeMenu}
              >
                <span>{category.title}</span>
              </Link>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
