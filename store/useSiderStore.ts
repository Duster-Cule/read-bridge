import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SiderStore {
  readingId: string | null
  setReadingId: (id: string | null) => void
  siderWidth: number
  setSiderWidth: (width: number) => void
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  thinkingExpanded: boolean
  setThinkingExpanded: (expanded: boolean) => void
}

export const useSiderStore = create<SiderStore>()(
  persist(
    (set) => ({
      readingId: null,
      setReadingId: (id) => set({ readingId: id }),
      siderWidth: 400,
      setSiderWidth: (width) => set({ siderWidth: width }),
      collapsed: false,
      setCollapsed: (collapsed) => set({ collapsed }),
      thinkingExpanded: true,
      setThinkingExpanded: (expanded) => set({ thinkingExpanded: expanded }),
    }),
    {
      name: 'sider-storage',
    }
  )
) 