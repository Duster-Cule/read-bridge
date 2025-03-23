import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface HeaderStore {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  toggleCollapsed: () => void
}

export const useHeaderStore = create<HeaderStore>()(
  persist(
    (set) => ({
      collapsed: false,
      setCollapsed: (collapsed) => set({ collapsed }),
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
    }),
    {
      name: 'header-storage',
    }
  )
) 