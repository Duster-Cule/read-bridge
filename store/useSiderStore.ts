import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SiderStore {
  siderWidth: number
  setSiderWidth: (width: number) => void
}

export const useSiderStore = create<SiderStore>()(
  persist(
    (set) => ({
      siderWidth: 400,
      setSiderWidth: (width) => set({ siderWidth: width }),
    }),
    {
      name: 'sider-storage',
    }
  )
) 