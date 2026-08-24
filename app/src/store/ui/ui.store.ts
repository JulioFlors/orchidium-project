import { create } from 'zustand'

interface State {
  isSidebarOpen: boolean
  isSearchBoxExpanded: boolean
  isSearchModalOpen: boolean
  sidebarRoute: string | null
  searchTerm: string

  openSidebar: () => void
  closeSidebar: () => void
  openSearchBox: () => void
  closeSearchBox: () => void
  openSearchModal: () => void
  closeSearchModal: () => void
  setSidebarRoute: (routeId: string | null) => void
  setSearchTerm: (term: string) => void
}

export const useUIStore = create<State>()((set) => ({
  isSidebarOpen: false,
  isSearchBoxExpanded: false,
  isSearchModalOpen: false,
  sidebarRoute: null,
  searchTerm: '',

  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  openSearchBox: () => set({ isSearchBoxExpanded: true }),
  closeSearchBox: () => set({ isSearchBoxExpanded: false }),
  openSearchModal: () => set({ isSearchModalOpen: true }),
  closeSearchModal: () => set({ isSearchModalOpen: false }),
  setSidebarRoute: (routeId: string | null) => set({ sidebarRoute: routeId }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),
}))
