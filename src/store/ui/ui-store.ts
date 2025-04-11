import { create } from 'zustand'

import { Species } from '@/interfaces'

interface State {
  isSidebarOpen: boolean
  isSearchBoxExpanded: boolean
  sidebarRoute: string | null
  searchTerm: string
  searchResults: Species[]

  openSidebar: () => void
  closeSidebar: () => void
  openSearchBox: () => void
  closeSearchBox: () => void
  setSidebarRoute: (routeId: string | null) => void
  setSearchTerm: (term: string) => void
  setSearchResults: (results: Species[]) => void
}

export const useUIStore = create<State>()((set) => ({
  isSidebarOpen: false,
  isSearchBoxExpanded: false,
  sidebarRoute: null,
  searchTerm: '',
  searchResults: [],

  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  openSearchBox: () => set({ isSearchBoxExpanded: true }),
  closeSearchBox: () => set({ isSearchBoxExpanded: false }),
  setSidebarRoute: (routeId: string | null) => set({ sidebarRoute: routeId }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),
  setSearchResults: (results: Species[]) => set({ searchResults: results }),
}))
