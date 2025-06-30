import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Bookmark } from '@/types/book'
import { generateUUID } from '@/utils/uuid'
import dayjs from 'dayjs'

interface BookmarkStore {
  bookmarksByBook: Record<string, Bookmark[]>
  getBookmarksByBookId: (bookId: string) => Bookmark[]
  getAllBookmarks: () => Bookmark[]
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createTime'>) => void
  removeBookmark: (bookId: string, bookmarkId: string) => void
  removeAllBookmarks: (bookId: string) => void
  getBookmarkCount: (bookId?: string) => number
}

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set, get) => ({
      bookmarksByBook: {},

      getBookmarksByBookId: (bookId: string) => {
        return get().bookmarksByBook[bookId] || []
      },

      getAllBookmarks: () => {
        const { bookmarksByBook } = get()
        return Object.values(bookmarksByBook).flat()
      },

      addBookmark: (bookmark) => set((state) => {
        const { bookId } = bookmark
        const newBookmark = {
          ...bookmark,
          id: generateUUID(),
          createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
        }

        return {
          bookmarksByBook: {
            ...state.bookmarksByBook,
            [bookId]: [...(state.bookmarksByBook[bookId] || []), newBookmark]
          }
        }
      }),

      removeBookmark: (bookId: string, bookmarkId: string) => set((state) => {
        const bookBookmarks = state.bookmarksByBook[bookId]
        if (!bookBookmarks) return state

        const filteredBookmarks = bookBookmarks.filter(bookmark => bookmark.id !== bookmarkId)

        return {
          bookmarksByBook: {
            ...state.bookmarksByBook,
            [bookId]: filteredBookmarks
          }
        }
      }),

      removeAllBookmarks: (bookId: string) => set((state) => {
        const { [bookId]: removed, ...rest } = state.bookmarksByBook
        return { bookmarksByBook: rest }
      }),

      getBookmarkCount: (bookId?: string) => {
        const { bookmarksByBook } = get()
        if (bookId) {
          return bookmarksByBook[bookId]?.length || 0
        }
        return Object.values(bookmarksByBook).reduce((total, bookmarks) => total + bookmarks.length, 0)
      }
    }),
    {
      name: 'bookmark-storage',
    }
  )
) 