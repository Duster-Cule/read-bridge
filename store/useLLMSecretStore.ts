import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LLMSecretStore {
  apiKeysByProviderId: Record<string, string>
  setApiKey: (providerId: string, apiKey: string) => void
  removeApiKey: (providerId: string) => void
  getApiKey: (providerId: string) => string
}

function normalizeApiKey(raw: string): string {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return ''
  return trimmed.replace(/^Bearer\s+/i, '').trim()
}

export const useLLMSecretStore = create<LLMSecretStore>()(
  persist(
    (set, get) => ({
      apiKeysByProviderId: {},
      setApiKey: (providerId, apiKey) => set(state => ({
        apiKeysByProviderId: {
          ...state.apiKeysByProviderId,
          [providerId]: normalizeApiKey(apiKey),
        },
      })),
      removeApiKey: (providerId) => set(state => {
        const { [providerId]: _, ...rest } = state.apiKeysByProviderId
        return { apiKeysByProviderId: rest }
      }),
      getApiKey: (providerId) => get().apiKeysByProviderId[providerId] || '',
    }),
    {
      name: 'llm-secret-storage',
      version: 1,
      migrate: (persistedState: unknown) => persistedState as unknown as LLMSecretStore,
    }
  )
)
