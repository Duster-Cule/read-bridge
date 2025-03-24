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
  // 自定义LLM服务商
  customProviders: Provider[]
  // 添加自定义LLM服务商
  addCustomProvider: () => void
  // 编辑自定义LLM服务商
  editCustomProvider: (provider: Provider) => void
  // 删除自定义LLM服务商
  deleteCustomProvider: (providerId: string) => void
}

export const useLLMStore = create<LLMStore>()(
  persist(
    (set, get) => ({
      providers: defaultProviders(),
      editProvider: (provider: Provider) => set({ providers: get().providers.map(p => p.id === provider.id ? provider : p) }),
      customProviders: [],
      addCustomProvider: () => set({ customProviders: [...get().customProviders, newProvider()] }),
      editCustomProvider: (provider: Provider) => set({ customProviders: get().customProviders.map(p => p.id === provider.id ? provider : p) }),
      deleteCustomProvider: (providerId: string) => set({ customProviders: get().customProviders.filter(p => p.id !== providerId) }),
    }),
    {
      name: 'llm-storage',
    }
  )
) 