import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface StyleStore {
  itemsPerRow: number
  gutterX: number
  gutterY: number
  lightModeTextColor: string
  darkModeTextColor: string
  setItemsPerRow: (itemsPerRow: number) => void
  setGutterX: (gutterX: number) => void
  setGutterY: (gutterY: number) => void
  setLightModeTextColor: (color: string) => void
  setDarkModeTextColor: (color: string) => void
}

export const useStyleStore = create<StyleStore>()(
  persist(
    (set) => ({
      itemsPerRow: 12,
      gutterX: 16,
      gutterY: 24,
      lightModeTextColor: '#000000',
      darkModeTextColor: '#ffffff',
      setItemsPerRow: (itemsPerRow) => set({ itemsPerRow }),
      setGutterX: (gutterX) => set({ gutterX }),
      setGutterY: (gutterY) => set({ gutterY }),
      setLightModeTextColor: (lightModeTextColor) => set({ lightModeTextColor }),
      setDarkModeTextColor: (darkModeTextColor) => set({ darkModeTextColor }),
    }),
    {
      name: 'style-storage',
    }
  )
) 