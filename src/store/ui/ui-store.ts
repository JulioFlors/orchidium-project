import { create } from 'zustand'

import { Subcategory, Category } from '@/interfaces'

interface State {
  isSideMenuOpen: boolean
  activeCategory: string | null
  searchTerm: string
  searchResults: (Subcategory | Category)[]

  openSideMenu: () => void
  closeSideMenu: () => void
  setActiveCategory: (categoryId: string | null) => void
  setSearchTerm: (term: string) => void
  setSearchResults: (results: (Subcategory | Category)[]) => void
}

export const useUIStore = create<State>()((set) => ({
  isSideMenuOpen: false,
  activeCategory: null,
  searchTerm: '',
  searchResults: [],

  openSideMenu: () => set({ isSideMenuOpen: true }),
  closeSideMenu: () => set({ isSideMenuOpen: false }),
  setActiveCategory: (categoryId: string | null) => set({ activeCategory: categoryId }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),
  setSearchResults: (results: (Subcategory | Category)[]) => set({ searchResults: results }),
}))
