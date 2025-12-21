import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TTSSecretStore {
  volcengine: {
    appid: string
    token: string
  }
  setVolcengineSecrets: (secrets: Partial<{ appid: string; token: string }>) => void
  clearVolcengineSecrets: () => void
}

export const useTTSSecretStore = create<TTSSecretStore>()(
  persist(
    (set) => ({
      volcengine: {
        appid: '',
        token: '',
      },
      setVolcengineSecrets: (secrets) => set(state => ({
        volcengine: {
          ...state.volcengine,
          ...secrets,
        },
      })),
      clearVolcengineSecrets: () => set({ volcengine: { appid: '', token: '' } }),
    }),
    {
      name: 'tts-secret-storage',
      version: 1,
      migrate: (persistedState: unknown) => persistedState as unknown as TTSSecretStore,
    }
  )
)
