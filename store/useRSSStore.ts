import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSettingsJSONStorage } from '@/store/persistStorage'

interface RSSState {
  rssUrlsText: string;
  setRssUrlsText: (text: string) => void;
}

export const useRSSStore = create<RSSState>()(
  persist(
    (set) => ({
      rssUrlsText: '',
      setRssUrlsText: (text) => set({ rssUrlsText: text }),
    }),
    {
      name: 'rss-storage',
      storage: createSettingsJSONStorage(),
      version: 2,
      migrate: (persistedState: unknown) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return { rssUrlsText: '' };
        }

        const state = persistedState as Record<string, unknown>;

        // Backward compatibility: v1 stored a single `rssUrl` string
        if (typeof state.rssUrl === 'string' && typeof state.rssUrlsText !== 'string') {
          return { rssUrlsText: state.rssUrl };
        }

        if (typeof state.rssUrlsText === 'string') {
          return { rssUrlsText: state.rssUrlsText };
        }

        return { rssUrlsText: '' };
      },
      partialize: (state) => ({
        rssUrlsText: state.rssUrlsText,
      }),
    }
  )
);
