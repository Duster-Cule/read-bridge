import { NextResponse } from 'next/server'
import path from 'path'
import type { Book } from '@/types/book'
import { requireAuth } from '@/app/api/_lib/auth'
import { readJsonFile, withWriteLockFor, writeJsonFileAtomic } from '@/app/api/_lib/jsonFileStore'

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

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if (auth) return auth

    const { id } = await context.params
    const db = await readDB()
    const book = db.books.find((b) => b.id === id) ?? null
    return NextResponse.json({ book })
  } catch (e: unknown) {
    console.error('[api/books/[id]] GET failed', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return withWriteLockFor(dbPath(), async () => {
    try {
      const auth = await requireAuth(request)
      if (auth) return auth

      const { id } = await context.params
      const body = (await request.json().catch(() => null)) as { book?: unknown } | null
      const book = body?.book as Book | undefined
      if (!book || typeof book !== 'object' || book.id !== id) {
        return NextResponse.json({ error: 'Invalid book' }, { status: 400 })
      }

      const db = await readDB()
      const idx = db.books.findIndex((b) => b.id === id)
      if (idx < 0) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

      db.books[idx] = book
      await writeDB(db)

      return NextResponse.json({ ok: true })
    } catch (e: unknown) {
      console.error('[api/books/[id]] PUT failed', e)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  })
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return withWriteLockFor(dbPath(), async () => {
    try {
      const auth = await requireAuth(request)
      if (auth) return auth

      const { id } = await context.params

      const db = await readDB()
      const idx = db.books.findIndex((b) => b.id === id)
      if (idx < 0) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

      db.books.splice(idx, 1)
      await writeDB(db)

      // Also remove reading progress
      const base = process.env.READ_BRIDGE_DATA_DIR || path.join(process.cwd(), '.data')
      const progressPath = path.join(base, 'reading-progress.json')
      const progressDB = await readJsonFile<{ progress: Record<string, unknown> }>(progressPath, { progress: {} })
      if (progressDB.progress && typeof progressDB.progress === 'object') {
        delete (progressDB.progress as Record<string, unknown>)[id]
        await writeJsonFileAtomic(progressPath, progressDB)
      }

      return NextResponse.json({ ok: true })
    } catch (e: unknown) {
      console.error('[api/books/[id]] DELETE failed', e)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  })
}
