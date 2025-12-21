import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createSettingsJSONStorage } from '@/store/persistStorage'
import { useTTSSecretStore } from '@/store/useTTSSecretStore'

interface TTSStore {
  ttsProvider: string
  setTTSProvider: (ttsProvider: string) => void
  ttsConfig: {
    system: {
      voiceType: string
      speedRatio: number
    }
    volcengine: {
      voiceType: string
      speedRatio: number
      appid: string
      token: string
    }
  }
  setTTSConfig: (type: string, config: {
    voiceType: string
    speedRatio: number
    appid?: string
    token?: string
  }) => void
  ttsGlobalConfig: {
    autoSentenceTTS: boolean
    autoWordTTS: boolean
  }
  setTTSGlobalConfig: (config: {
    autoSentenceTTS?: boolean
    autoWordTTS?: boolean
  }) => void
}

export const useTTSStore = create<TTSStore>()(
  persist(
    (set) => ({
      ttsProvider: 'system',
      setTTSProvider: (ttsProvider) => set({ ttsProvider }),

      ttsConfig: {
        system: {
          voiceType: 'Google US English',
          speedRatio: 1.0,
        },
        volcengine: {
          voiceType: '',
          speedRatio: 1.0,
          appid: '',
          token: '',
        },
      },
      setTTSConfig: (type, config) => {
        if (type === 'volcengine') {
          const { appid, token, ...rest } = config
          useTTSSecretStore.getState().setVolcengineSecrets({
            ...(typeof appid === 'string' ? { appid } : {}),
            ...(typeof token === 'string' ? { token } : {}),
          })

          set((state) => ({
            ttsConfig: {
              ...state.ttsConfig,
              volcengine: {
                ...state.ttsConfig.volcengine,
                ...rest,
                // Do not persist secrets in this store; they are hydrated separately.
                appid: '',
                token: '',
              },
            },
          }))
          return
        }

        set((state) => ({
          ttsConfig: {
            ...state.ttsConfig,
            [type]: config,
          },
        }))
      },

      ttsGlobalConfig: {
        autoSentenceTTS: true,
        autoWordTTS: true,
      },
      setTTSGlobalConfig: (config) => set((state) => ({
        ttsGlobalConfig: {
          ...state.ttsGlobalConfig,
          ...config,
        },
      })),
    }),
    {
      name: 'tts-storage',
      storage: createSettingsJSONStorage(),
      partialize: (state) => ({
        ...state,
        ttsConfig: {
          ...state.ttsConfig,
          volcengine: {
            ...state.ttsConfig.volcengine,
            appid: '',
            token: '',
          },
        },
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return

        const { appid, token } = useTTSSecretStore.getState().volcengine
        if (appid || token) {
          state.ttsConfig = {
            ...state.ttsConfig,
            volcengine: {
              ...state.ttsConfig.volcengine,
              appid,
              token,
            },
          }
        }
      },
    }
  )
) 