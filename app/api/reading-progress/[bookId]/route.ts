import { NextResponse } from 'next/server'
import path from 'path'
import nlp from 'compromise'
import type { Book, ReadingProgress } from '@/types/book'
import { requireAuth } from '@/app/api/_lib/auth'
import { readJsonFile, withWriteLockFor, writeJsonFileAtomic } from '@/app/api/_lib/jsonFileStore'

export const runtime = 'nodejs'

type BooksDB = { books: Book[] }

function booksPath(): string {
  const base = process.env.READ_BRIDGE_DATA_DIR || path.join(process.cwd(), '.data')
  return path.join(base, 'books-db.json')
}

async function readBooksDB(): Promise<BooksDB> {
  const raw = await readJsonFile<BooksDB>(booksPath(), { books: [] })
  const books = Array.isArray(raw?.books) ? raw.books : []
  return { books }
}

type ProgressDB = { progress: Record<string, ReadingProgress> }

function progressPath(): string {
  const base = process.env.READ_BRIDGE_DATA_DIR || path.join(process.cwd(), '.data')
  return path.join(base, 'reading-progress.json')
}

async function readProgressDB(): Promise<ProgressDB> {
  const raw = await readJsonFile<ProgressDB>(progressPath(), { progress: {} })
  const progress = raw?.progress && typeof raw.progress === 'object' ? raw.progress : {}
  return { progress: progress as Record<string, ReadingProgress> }
}

async function writeProgressDB(db: ProgressDB): Promise<void> {
  await writeJsonFileAtomic(progressPath(), db)
}

function paragraphs2Lines(book: Book, chapterIndex: number): string[] {
  const chapter = book.chapterList?.[chapterIndex]
  const paragraphs = Array.isArray(chapter?.paragraphs) ? chapter.paragraphs : []

  const allSentences: string[] = []
  paragraphs.forEach((paragraph) => {
    const text = String(paragraph ?? '')
    const isChinese = /[\u4e00-\u9fa5]/.test(text)
    let sentences: string[] = []
    if (isChinese) sentences = text.match(/[^。！？]+[。！？]/g) || []
    else {
      const doc = nlp(text)
      sentences = doc.sentences().out('array')
    }
    allSentences.push(...sentences, 'EOB')
  })

  return allSentences.reduce((acc, sentence) => {
    if (sentence === 'EOB') {
      acc.push('')
      return acc
    }
    acc.push(sentence)
    return acc
  }, [] as string[])
}

async function ensureProgress(bookId: string): Promise<ReadingProgress> {
  const db = await readProgressDB()
  const existing = db.progress[bookId]
  if (existing) return existing

  const created: ReadingProgress = {
    bookId,
    lastReadTime: Date.now(),
    currentLocation: { chapterIndex: 0, lineIndex: 0 },
    sentenceChapters: {},
  }

  db.progress[bookId] = created
  await writeProgressDB(db)
  return created
}

async function ensureSentenceChapter(bookId: string, progress: ReadingProgress): Promise<ReadingProgress> {
  const chapterIndex = progress.currentLocation?.chapterIndex ?? 0
  if (progress.sentenceChapters && progress.sentenceChapters[chapterIndex]) return progress

  const booksDB = await readBooksDB()
  const book = booksDB.books.find((b) => b.id === bookId)
  if (!book) return progress

  const lines = paragraphs2Lines(book, chapterIndex)
  const db = await readProgressDB()
  const current = db.progress[bookId] ?? progress
  const sentenceChapters = current.sentenceChapters ?? {}
  const updated: ReadingProgress = {
    ...current,
    sentenceChapters: { ...sentenceChapters, [chapterIndex]: lines },
  }

  db.progress[bookId] = updated
  await writeProgressDB(db)
  return updated
}

export async function GET(request: Request, context: { params: Promise<{ bookId: string }> }) {
  try {
    const auth = await requireAuth(request)
    if (auth) return auth

    const { bookId } = await context.params
    const progress = await ensureProgress(bookId)
    const updated = await ensureSentenceChapter(bookId, progress)
    return NextResponse.json({ readingProgress: updated })
  } catch (e: unknown) {
    console.error('[api/reading-progress] GET failed', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: Request, context: { params: Promise<{ bookId: string }> }) {
  return withWriteLockFor(progressPath(), async () => {
    try {
      const auth = await requireAuth(request)
      if (auth) return auth

      const { bookId } = await context.params
      const body = (await request.json().catch(() => null)) as { currentLocation?: unknown; reset?: unknown } | null

      if (body?.reset === true) {
        const db = await readProgressDB()
        delete db.progress[bookId]
        await writeProgressDB(db)
        const created = await ensureProgress(bookId)
        const updated = await ensureSentenceChapter(bookId, created)
        return NextResponse.json({ readingProgress: updated })
      }

      const loc = body?.currentLocation as { chapterIndex?: unknown; lineIndex?: unknown } | undefined
      const chapterIndex = typeof loc?.chapterIndex === 'number' ? loc.chapterIndex : null
      const lineIndex = typeof loc?.lineIndex === 'number' ? loc.lineIndex : null
      if (chapterIndex == null || lineIndex == null) {
        return NextResponse.json({ error: 'Invalid currentLocation' }, { status: 400 })
      }

      const db = await readProgressDB()
      const current = db.progress[bookId] ?? (await ensureProgress(bookId))
      const updated: ReadingProgress = {
        ...current,
        lastReadTime: Date.now(),
        currentLocation: { chapterIndex, lineIndex },
      }
      db.progress[bookId] = updated
      await writeProgressDB(db)

      return NextResponse.json({ ok: true })
    } catch (e: unknown) {
      console.error('[api/reading-progress] PUT failed', e)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  })
}

export async function DELETE(request: Request, context: { params: Promise<{ bookId: string }> }) {
  return withWriteLockFor(progressPath(), async () => {
    try {
      const auth = await requireAuth(request)
      if (auth) return auth

      const { bookId } = await context.params
      const db = await readProgressDB()
      delete db.progress[bookId]
      await writeProgressDB(db)
      return NextResponse.json({ ok: true })
    } catch (e: unknown) {
      console.error('[api/reading-progress] DELETE failed', e)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  })
}
