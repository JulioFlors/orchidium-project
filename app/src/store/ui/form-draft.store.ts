import { create } from 'zustand'

interface FormDraftState {
  drafts: Record<string, unknown>
  setDraft: (key: string, data: unknown) => void
  getDraft: (key: string) => unknown
  clearDraft: (key: string) => void
  clearAll: () => void
}

export const useFormDraftStore = create<FormDraftState>()((set, get) => ({
  drafts: {},
  setDraft: (key, data) =>
    set((state) => ({
      drafts: {
        ...state.drafts,
        [key]: data,
      },
    })),
  getDraft: (key) => get().drafts[key],
  clearDraft: (key) =>
    set((state) => {
      const newDrafts = { ...state.drafts }

      delete newDrafts[key]

      return { drafts: newDrafts }
    }),
  clearAll: () => set({ drafts: {} }),
}))
