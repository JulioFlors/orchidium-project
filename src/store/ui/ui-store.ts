import { create } from 'zustand'

import { Route, Category } from '@/interfaces'

interface State {
  isSideMenuOpen: boolean
  activeRoute: string | null
  searchTerm: string
  searchResults: (Route | Category)[]

  openSideMenu: () => void
  closeSideMenu: () => void
  setActiveRoute: (routeId: string | null) => void
  setSearchTerm: (term: string) => void
  setSearchResults: (results: (Route | Category)[]) => void
}

export const useUIStore = create<State>()((set) => ({
  isSideMenuOpen: false,
  activeRoute: null,
  searchTerm: '',
  searchResults: [],

  openSideMenu: () => set({ isSideMenuOpen: true }),
  closeSideMenu: () => set({ isSideMenuOpen: false }),
  setActiveRoute: (routeId: string | null) => set({ activeRoute: routeId }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),
  setSearchResults: (results: (Route | Category)[]) => set({ searchResults: results }),
}))
