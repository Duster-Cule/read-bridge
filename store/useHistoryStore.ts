import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LLMHistory } from '@/types/llm'
interface HistoryStore {
  historys: LLMHistory[]
  addHistory: (history: LLMHistory) => void
  updateHistory: (history: LLMHistory) => void
  deleteHistory: (id: string) => void
}

// TODO history有问题
export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      historys: [],
      addHistory: (history) => set((state) => ({ historys: [...state.historys, history] })),
      updateHistory: (history) => set((state) => {
        const id = history.id
        const index = state.historys.findIndex(item => item.id === id)
        if (index !== -1) {
          state.historys[index] = history
        } else {
          state.historys.push(history)
        }
        return state
      }),
      deleteHistory: (id) => set((state) => ({ historys: state.historys.filter(item => item.id !== id) })),
    }),
    {
      name: 'history-storage',
    }
  )
)


