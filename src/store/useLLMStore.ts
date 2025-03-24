import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Provider } from '@/src/types/llm'
import { newProvider } from '@/src/utils/provider'
import { defaultProviders } from '@/src/config/llm'
interface LLMStore {
  // LLM服务商列表
  providers: Provider[]
  // 编辑服务商信息
  editProvider: (provider: Provider) => void
  // 添加自定义LLM服务商
  addProvider: () => void
  // 删除LLM服务商
  deleteProvider: (providerId: string) => void
}

export const useLLMStore = create<LLMStore>()(
  persist(
    (set, get) => ({
      providers: defaultProviders(),
      editProvider: (provider: Provider) => set({ providers: get().providers.map(p => p.id === provider.id ? provider : p) }),
      addProvider: () => set({ providers: [...get().providers, newProvider()] }),
      deleteProvider: (providerId: string) => set({ providers: get().providers.filter(p => p.id !== providerId) }),
    }),
    {
      name: 'llm-storage',
    }
  )
) 