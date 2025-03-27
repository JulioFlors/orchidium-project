import { create } from 'zustand'

interface State {
  isSideMenuOpen: boolean
  activeCategory: string | null
  searchTerm: string

  openSideMenu: () => void
  closeSideMenu: () => void
  setActiveCategory: (categoryId: string | null) => void
  setSearchTerm: (term: string) => void
}

export const useUIStore = create<State>()((set) => ({
  isSideMenuOpen: false,
  activeCategory: null,
  searchTerm: '',

  openSideMenu: () => set({ isSideMenuOpen: true }),
  closeSideMenu: () => set({ isSideMenuOpen: false }),
  setActiveCategory: (categoryId: string | null) => set({ activeCategory: categoryId }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),
}))
