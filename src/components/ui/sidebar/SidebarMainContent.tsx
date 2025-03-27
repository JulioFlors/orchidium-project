'use client'

import Link from 'next/link'
import { IoChevronForwardOutline } from 'react-icons/io5'

import { SidebarSearch } from './SidebarSearch'
import { Category, Subcategory } from './types'

import { useUIStore } from '@/store'

interface SidebarMainContentProps {
  searchResults: (Subcategory | Category)[]
  categories: Category[]
}

export function SidebarMainContent({ searchResults, categories }: SidebarMainContentProps) {
  const closeMenu = useUIStore((state) => state.closeSideMenu)
  const setActiveCategory = useUIStore((state) => state.setActiveCategory)

  return (
    <>
      <SidebarSearch searchResults={searchResults} />

      <div className="w-full" id="renderMainContent">
        {categories.map((category) => (
          <div key={category.id} className="mb-2">
            {category.subcategories ? (
              <button
                className="focus-sidebar-content group hover:bg-hover mb-2 flex w-full items-center justify-between rounded p-2 font-medium text-black transition-colors duration-300"
                type="button"
                onClick={() => setActiveCategory(category.id)}
              >
                <span>{category.title}</span>
                <span className="text-secondary group-hover:text-primary transition-colors duration-300">
                  <IoChevronForwardOutline size={16} />
                </span>
              </button>
            ) : (
              <Link
                className="focus-sidebar-content hover:bg-hover mb-2 flex items-center justify-between rounded p-2 font-medium transition-colors duration-300"
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
