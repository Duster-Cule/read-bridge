import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Model, Provider } from '@/types/llm'
import { newProvider } from '@/utils/provider'
import { defaultProviders } from '@/config/llm'
import { createSettingsJSONStorage } from '@/store/persistStorage'
import { useLLMSecretStore } from '@/store/useLLMSecretStore'
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

// 合并默认providers和已保存的providers
function mergeProviders(savedProviders: Provider[] | undefined): Provider[] {
  const defaults = defaultProviders()
  
  // 如果没有保存的数据，直接返回默认值
  if (!savedProviders || savedProviders.length === 0) {
    return defaults
  }

  // 合并逻辑：保留已保存的provider，添加新的默认provider
  const result = [...savedProviders]
  
  defaults.forEach(defaultProvider => {
    const exists = result.find(p => p.id === defaultProvider.id)
    if (!exists) {
      // 如果是新的默认provider，添加到列表
      result.push(defaultProvider)
    }
  })
  
  return result
}

function applyProviderApiKeys(providers: Provider[]): Provider[] {
  const secrets = useLLMSecretStore.getState().apiKeysByProviderId
  return providers.map(p => {
    if (p.type === 'ollama') return p
    const apiKey = secrets[p.id] ?? p.apiKey ?? ''
    return { ...p, apiKey }
  })
}

function stripProviderApiKeysForPersist(providers: Provider[]): Provider[] {
  return providers.map(p => {
    if (p.type === 'ollama') return p
    return { ...p, apiKey: '' }
  })
}

export const useLLMStore = create<LLMStore>()(
  persist(
    (set, get) => ({
      level: 3,
      setLevel: (level: number) => set({ level }),
      providers: applyProviderApiKeys(defaultProviders()),
      editProvider: (provider: Provider) => {
        if (provider.type !== 'ollama') {
          useLLMSecretStore.getState().setApiKey(provider.id, provider.apiKey || '')
        }
        set({ providers: get().providers.map(p => p.id === provider.id ? provider : p) })
      },
      addProvider: () => {
        const p = newProvider()
        useLLMSecretStore.getState().setApiKey(p.id, p.apiKey || '')
        set({ providers: [...get().providers, p] })
      },
      deleteProvider: (providerId: string) => {
        useLLMSecretStore.getState().removeApiKey(providerId)
        set({ providers: get().providers.filter(p => p.id !== providerId) })
      },
      models: () => get().providers.filter(p => {
        // ollama本地模型不需要apiKey
        if (p.type === 'ollama') {
          return !!p.baseUrl && p.models.length > 0
        }
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
      storage: createSettingsJSONStorage(),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // 迁移逻辑：合并新的默认providers
        if (persistedState && persistedState.providers) {
          persistedState.providers = mergeProviders(persistedState.providers)
        }
        return persistedState
      },
      partialize: (state) => ({
        ...state,
        providers: stripProviderApiKeysForPersist(state.providers),
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.providers) {
          state.providers = applyProviderApiKeys(state.providers)
        }
      },
    }
  )
) 