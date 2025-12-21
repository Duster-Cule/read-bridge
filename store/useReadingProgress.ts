import db from '@/services/DB'
import { ReadingProgress } from '@/types/book'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createSettingsJSONStorage } from '@/store/persistStorage'

interface ReadingProgressStore {
  readingProgress: ReadingProgress
  setReadingProgress: (readingProgress: ReadingProgress) => void
  updateReadingProgress: (bookId: string) => Promise<ReadingProgress>
}

export const useReadingProgressStore = create<ReadingProgressStore>()(
  persist(
    (set) => ({
      readingProgress: {
        bookId: '',
        lastReadTime: 0,
        currentLocation: {
          chapterIndex: 0,
          lineIndex: 0
        },
        sentenceChapters: {},
      },
      setReadingProgress: (readingProgress) => set({ readingProgress }),
      updateReadingProgress: async (bookId) => {
          try {
            const res = await db.getCurrentLocation(bookId)
            set({ readingProgress: res })
            return res
          } catch {
            const fallback: ReadingProgress = {
              bookId: '',
              lastReadTime: 0,
              currentLocation: {
                chapterIndex: 0,
                lineIndex: 0
              },
              sentenceChapters: {},
            }
            set({ readingProgress: fallback })
            return fallback
          }
      },
    }),
    {
      name: 'reading-progress-storage',
      storage: createSettingsJSONStorage(),
    }
  )
) 