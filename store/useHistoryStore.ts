import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LLMHistory } from '@/types/llm'
interface HistoryStore {
  historys: LLMHistory[]
  setHistory: (history: LLMHistory) => void
  addHistory: (history: LLMHistory) => void
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      historys: [],
      setHistory: (history) => set((state) => ({ historys: [...state.historys, history] })),
      addHistory: (history) => set((state) => ({ historys: [...state.historys, history] })),
    }),
    {
      name: 'history-storage',
    }
  )
)

