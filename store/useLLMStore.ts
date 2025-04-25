import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Model, Provider } from '@/types/llm'
import { newProvider } from '@/utils/provider'
import { defaultProviders } from '@/config/llm'
interface LLMStore {
  level: number
  setLevel: (level: number) => void
  // LLM服务商列表
  providers: Provider[]
  // 编辑服务商信息
  editProvider: (provider: Provider) => void
  // 添加自定义LLM服务商
  addProvider: () => void
  // 删除LLM服务商
  deleteProvider: (providerId: string) => void
  // LLM可用列表
  models: () => Model[]
  // 聊天模型
  chatModel: Model | null
  // 设置聊天模型
  setChatModel: (model: Model | null) => void
  // 解析模型
  parseModel: Model | null
  // 设置解析模型
  setParseModel: (model: Model | null) => void
}

export const useLLMStore = create<LLMStore>()(
  persist(
    (set, get) => ({
      level: 3,
      setLevel: (level: number) => set({ level }),
      providers: defaultProviders(),
      editProvider: (provider: Provider) => set({ providers: get().providers.map(p => p.id === provider.id ? provider : p) }),
      addProvider: () => set({ providers: [...get().providers, newProvider()] }),
      deleteProvider: (providerId: string) => set({ providers: get().providers.filter(p => p.id !== providerId) }),
      models: () => get().providers.filter(p => {
        if (!!p.baseUrl && !!p.apiKey && p.models.length > 0) {
          return true
        }
        return false
      }).map(p => p.models).flat(),
      chatModel: null,
      setChatModel: (model: Model | null) => set({ chatModel: model }),
      parseModel: null,
      setParseModel: (model: Model | null) => set({ parseModel: model }),
    }),
    {
      name: 'llm-storage',
    }
  )
) 