// Server-backed DB for web mode.
// Persists books to `.data/*.json` via Next.js API routes.

import type { Book, BookPreview, ReadingProgress } from '@/types/book'

export const DB_CHANGED_EVENT = 'read-bridge:db-changed'

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function emitDBChanged(): void {
  if (!isBrowser()) return
  try {
    window.dispatchEvent(new Event(DB_CHANGED_EVENT))
  } catch {
    // ignore
  }
}

async function readJsonOrThrow<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => null)) as T | null
  if (data == null) throw new Error('Invalid JSON response')
  return data
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const message = text || `${res.status} ${res.statusText}`
    throw new HttpError(res.status, message)
  }

  return readJsonOrThrow<T>(res)
}

async function requestNoJson(input: string, init?: RequestInit): Promise<void> {
  const res = await fetch(input, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const message = text || `${res.status} ${res.statusText}`
    throw new HttpError(res.status, message)
  }
}

function normalizeBookUploadTime(book: Book): Book {
  if (book.uploadTime == null) {
    return {
      ...book,
      uploadTime: book.createTime ?? Date.now(),
    }
  }
  return book
}

class ServerBookDB {
  async addBook(book: Book): Promise<string> {
    const resp = await request<{ id: string }>('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book }),
    })
    emitDBChanged()
    return resp.id
  }

  async getBook(id: string): Promise<Book | null> {
    const resp = await request<{ book: Book | null }>(`/api/books/${encodeURIComponent(id)}`)
    return resp.book ? normalizeBookUploadTime(resp.book) : null
  }

  async getAllBooks(reverse = true): Promise<Book[]> {
    const resp = await request<{ books: Book[] }>(`/api/books?reverse=${reverse ? 'true' : 'false'}`)
    return (resp.books ?? []).map(normalizeBookUploadTime)
  }

  async getAllBooksPreview(): Promise<BookPreview[]> {
    const resp = await request<{ books: BookPreview[] }>('/api/books?mode=preview')
    return resp.books ?? []
  }

  async updateBook(id: string, book: Book): Promise<void> {
    await request<{ ok: true }>(`/api/books/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book }),
    })
    emitDBChanged()
  }

  async updateBookField<K extends keyof Book>(id: string, type: K, value: Book[K]): Promise<void> {
    const existing = await this.getBook(id)
    if (!existing) throw new Error('Book not found')
    const updated = { ...existing, [type]: value } as Book
    await this.updateBook(id, updated)
  }

  async deleteBook(id: string): Promise<void> {
    await request<{ ok: true }>(`/api/books/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    emitDBChanged()
  }

  async addReadingProgress(bookId: string): Promise<ReadingProgress> {
    const resp = await request<{ readingProgress: ReadingProgress }>(
      `/api/reading-progress/${encodeURIComponent(bookId)}`
    )
    return resp.readingProgress
  }

  async resetReadingProgress(bookId: string): Promise<void> {
    await request<{ readingProgress: ReadingProgress }>(`/api/reading-progress/${encodeURIComponent(bookId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset: true }),
    })
    emitDBChanged()
  }

  async deleteReadingProgress(bookId: string): Promise<void> {
    await request<{ ok: true }>(`/api/reading-progress/${encodeURIComponent(bookId)}`, {
      method: 'DELETE',
    })
  }

  async updateCurrentLocation(bookId: string, currentLocation: ReadingProgress['currentLocation']): Promise<void> {
    // Do NOT emit DB_CHANGED_EVENT here; it fires on scroll and would spam listeners.
    await requestNoJson(`/api/reading-progress/${encodeURIComponent(bookId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentLocation }),
    })
  }

  async getLastReadTime(bookId: string): Promise<number> {
    const progress = await this.getCurrentLocation(bookId)
    return progress.lastReadTime ?? 0
  }

  async getCurrentLocation(bookId: string): Promise<ReadingProgress> {
    const resp = await request<{ readingProgress: ReadingProgress }>(
      `/api/reading-progress/${encodeURIComponent(bookId)}`
    )
    return resp.readingProgress
  }

  // Kept for API parity; sentence chapters are generated server-side.
  async updateSentenceChapters(): Promise<void> {
    return
  }

  // Optional legacy helpers (client-side filtering)
  async getBooks(type: string, value: string, reverse = true): Promise<Book[]> {
    const books = await this.getAllBooks(reverse)
    return books.filter((b) => {
      if (type === 'id') return b.id === value
      if (type === 'title') return b.title === value
      if (type === 'fileHash') return b.fileHash === value
      if (type === 'author') return (b.author ?? '') === value
      if (type === 'metadata.language') return (b.metadata as any)?.language === value
      if (type === 'metadata.identifier') return (b.metadata as any)?.identifier === value
      return false
    })
  }

  async getBooksPreview(type: string, value: string, reverse = true): Promise<BookPreview[]> {
    const books = await this.getBooks(type, value, reverse)
    return books.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      cover: (b.metadata as any)?.cover,
      uploadTime: b.uploadTime ?? b.createTime,
      createTime: b.createTime,
    }))
  }
}

const db = new ServerBookDB()
export default db
