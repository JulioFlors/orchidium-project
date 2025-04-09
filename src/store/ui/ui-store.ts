import { create } from 'zustand'

import { Route, Category } from '@/interfaces'

interface State {
  isSideMenuOpen: boolean
  sidebarRoute: string | null
  searchTerm: string
  searchResults: (Route | Category)[]

  openSideMenu: () => void
  closeSideMenu: () => void
  setSidebarRoute: (routeId: string | null) => void
  setSearchTerm: (term: string) => void
  setSearchResults: (results: (Route | Category)[]) => void
}

export const useUIStore = create<State>()((set) => ({
  isSideMenuOpen: false,
  sidebarRoute: null,
  searchTerm: '',
  searchResults: [],

  openSideMenu: () => set({ isSideMenuOpen: true }),
  closeSideMenu: () => set({ isSideMenuOpen: false }),
  setSidebarRoute: (routeId: string | null) => set({ sidebarRoute: routeId }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),
  setSearchResults: (results: (Route | Category)[]) => set({ searchResults: results }),
}))
