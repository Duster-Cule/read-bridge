import { NextResponse } from 'next/server'
import path from 'path'
import type { Book, BookPreview } from '@/types/book'
import { requireAuth } from '@/app/api/_lib/auth'
import { readJsonFile, withWriteLock, writeJsonFileAtomic } from '@/app/api/_lib/jsonFileStore'

export const runtime = 'nodejs'

type BooksDB = { books: Book[] }

function dbPath(): string {
  const base = process.env.READ_BRIDGE_DATA_DIR || path.join(process.cwd(), '.data')
  return path.join(base, 'books-db.json')
}

async function readDB(): Promise<BooksDB> {
  const raw = await readJsonFile<BooksDB>(dbPath(), { books: [] })
  const books = Array.isArray(raw?.books) ? raw.books : []
  return { books }
}

async function writeDB(db: BooksDB): Promise<void> {
  await writeJsonFileAtomic(dbPath(), db)
}

function toPreview(book: Book): BookPreview {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    cover: book.metadata?.cover,
    uploadTime: book.uploadTime ?? book.createTime,
    createTime: book.createTime,
  }
}

function sortBooksByLastReadTime(books: Book[], lastReadTimeById: Map<string, number>, reverse: boolean): Book[] {
  return [...books].sort((a, b) => {
    const timeA = lastReadTimeById.get(a.id) ?? a.uploadTime ?? a.createTime ?? 0
    const timeB = lastReadTimeById.get(b.id) ?? b.uploadTime ?? b.createTime ?? 0
    return reverse ? timeB - timeA : timeA - timeB
  })
}

async function readReadingProgressMap(): Promise<Map<string, number>> {
  const base = process.env.READ_BRIDGE_DATA_DIR || path.join(process.cwd(), '.data')
  const progressPath = path.join(base, 'reading-progress.json')
  const raw = await readJsonFile<{ progress: Record<string, { lastReadTime?: number } | undefined> }>(progressPath, {
    progress: {},
  })

  const map = new Map<string, number>()
  const obj = raw?.progress && typeof raw.progress === 'object' ? raw.progress : {}
  for (const [bookId, p] of Object.entries(obj)) {
    if (p && typeof p.lastReadTime === 'number') map.set(bookId, p.lastReadTime)
  }
  return map
}

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth) return auth

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') // 'preview' | null
    const reverse = searchParams.get('reverse') !== 'false'

    const db = await readDB()
    const lastReadTime = await readReadingProgressMap()
    const sorted = sortBooksByLastReadTime(db.books, lastReadTime, reverse)

    if (mode === 'preview') {
      return NextResponse.json({ books: sorted.map(toPreview) })
    }

    return NextResponse.json({ books: sorted })
  } catch (e: unknown) {
    console.error('[api/books] GET failed', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return withWriteLock(async () => {
    try {
      const auth = await requireAuth(request)
      if (auth) return auth

      const body = (await request.json().catch(() => null)) as { book?: unknown } | null
      const book = body?.book as Book | undefined
      if (!book || typeof book !== 'object' || typeof book.id !== 'string') {
        return NextResponse.json({ error: 'Invalid book' }, { status: 400 })
      }

      const db = await readDB()

      // Avoid duplicates by fileHash
      if (book.fileHash && db.books.some((b) => b.fileHash === book.fileHash)) {
        return NextResponse.json({ error: 'Book already exists' }, { status: 409 })
      }

      // Ensure uploadTime exists
      const now = Date.now()
      const normalized: Book = {
        ...book,
        uploadTime: (book as any).uploadTime ?? book.createTime ?? now,
        createTime: book.createTime ?? now,
      }

      db.books.push(normalized)
      await writeDB(db)

      return NextResponse.json({ id: normalized.id })
    } catch (e: unknown) {
      console.error('[api/books] POST failed', e)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  })
}
