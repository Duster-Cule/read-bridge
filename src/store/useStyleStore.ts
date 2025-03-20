import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface StyleStore {
  itemsPerRow: number
  gutterX: number
  gutterY: number
  setItemsPerRow: (itemsPerRow: number) => void
  setGutterX: (gutterX: number) => void
  setGutterY: (gutterY: number) => void
}

export const useStyleStore = create<StyleStore>()(
  persist(
    (set) => ({
      itemsPerRow: 12,
      gutterX: 16,
      gutterY: 24,
      setItemsPerRow: (itemsPerRow) => set({ itemsPerRow }),
      setGutterX: (gutterX) => set({ gutterX }),
      setGutterY: (gutterY) => set({ gutterY }),
    }),
    {
      name: 'style-storage',
    }
  )
) 