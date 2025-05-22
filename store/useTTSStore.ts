import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TTSStore {
  ttsProvider: string
  setTTSProvider: (ttsProvider: string) => void
  ttsConfig: {
    system: {
      voiceType: string
      speedRatio: string
    }
    volcengine: {
      voiceType: string
      speedRatio: string
      appid: string
      token: string
    }
  }
  setTTSConfig: (type: string, config: {
    voiceType: string
    speedRatio: string
    appid?: string
    token?: string
  }) => void
}

export const useTTSStore = create<TTSStore>()(
  persist(
    (set) => ({
      ttsProvider: 'system',
      setTTSProvider: (ttsProvider) => set({ ttsProvider }),

      ttsConfig: {
        system: {
          voiceType: 'xiaoyan',
          speedRatio: '1.0',
        },
        volcengine: {
          voiceType: 'xiaoyan',
          speedRatio: '1.0',
          appid: '',
          token: '',
        },
      },
      setTTSConfig: (type, config) => set((state) => ({
        ttsConfig: {
          ...state.ttsConfig,
          [type]: config,
        },
      })),
    }),
    {
      name: 'tts-storage',
    }
  )
) 