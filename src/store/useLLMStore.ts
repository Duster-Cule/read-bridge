import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Model } from '@/src/types/llm'

interface LLMStore {
  provider: string
  setProvider: (provider: string) => void
  baseUrl: string
  setBaseUrl: (baseUrl: string) => void
  apiKey: string
  setApiKey: (apiKey: string) => void
  model: Model | null
  setModel: (model: Model | null) => void
  Temperature: number
  setTemperature: (temperature: number) => void
  topP: number
  setTopP: (topP: number) => void
}

export const useLLMStore = create<LLMStore>()(
  persist(
    (set) => ({
      provider: '',
      setProvider: (provider) => set({ provider }),
      baseUrl: '',
      setBaseUrl: (baseUrl) => set({ baseUrl }),
      apiKey: '',
      setApiKey: (apiKey) => set({ apiKey }),
      model: null,
      setModel: (model) => set({ model }),
      Temperature: 0.6,
      setTemperature: (Temperature) => set({ Temperature }),
      topP: 1,
      setTopP: (topP) => set({ topP }),
    }),
    {
      name: 'llm-storage',
    }
  )
) 