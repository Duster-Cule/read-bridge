import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'

import { BOOK_MIME_TYPE } from '@/constants/book'
import type { BOOK_MIME_TYPE_TYPE, Book } from '@/types/book'
import { processBook } from '@/services/BookService'
import { readJsonFile, withWriteLock, writeJsonFileAtomic } from '@/app/api/_lib/jsonFileStore'
import { generateUUID } from '@/utils/uuid'

export const runtime = 'nodejs'

type BooksDB = { books: Book[] }

function dataDir(): string {
  return process.env.READ_BRIDGE_DATA_DIR || path.join(process.cwd(), '.data')
}

function booksDbPath(): string {
  return path.join(dataDir(), 'books-db.json')
}

async function readDB(): Promise<BooksDB> {
  const raw = await readJsonFile<BooksDB>(booksDbPath(), { books: [] })
  const books = Array.isArray(raw?.books) ? raw.books : []
  return { books }
}

async function writeDB(db: BooksDB): Promise<void> {
  await writeJsonFileAtomic(booksDbPath(), db)
}

function mimeFromFilename(filename: string): BOOK_MIME_TYPE_TYPE | null {
  const ext = path.extname(filename).toLowerCase()
  switch (ext) {
    case '.pdf':
      return BOOK_MIME_TYPE.PDF
    case '.txt':
      return BOOK_MIME_TYPE.TXT
    case '.md':
      return BOOK_MIME_TYPE.MD
    case '.epub':
      return BOOK_MIME_TYPE.EPUB_ZIP
    default:
      return null
  }
}

function titleFromFilename(filename: string): string {
  const base = path.basename(filename)
  const withoutExt = base.replace(path.extname(base), '')
  return withoutExt || base
}

export async function POST(request: Request) {
  return withWriteLock(async () => {
    try {
      const { searchParams } = new URL(request.url)
      const dryRun = searchParams.get('dryRun') === 'true'

      const dir = path.join(process.cwd(), 'books')
      let files: string[] = []
      try {
        files = await fs.readdir(dir)
      } catch {
        return NextResponse.json({ ok: true, imported: 0, skipped: 0, totalFiles: 0, message: 'books/ directory not found' })
      }

      const db = await readDB()
      const existingByFileHash = new Set(db.books.map((b) => b.fileHash).filter(Boolean))

      let imported = 0
      let skipped = 0

      for (const filename of files) {
        if (!filename || filename.startsWith('.')) continue

        const mime = mimeFromFilename(filename)
        if (!mime) {
          skipped++
          continue
        }

        const filePath = path.join(dir, filename)
        let buffer: Buffer
        try {
          buffer = await fs.readFile(filePath)
        } catch {
          skipped++
          continue
        }

        const hash = crypto.createHash('sha256').update(buffer).digest('hex')
        if (existingByFileHash.has(hash)) {
          skipped++
          continue
        }

        const title = titleFromFilename(filename)
        const now = Date.now()

        // pdf.js worker resolution is fragile in Next.js route handlers.
        // For import purposes, we only need a book record + sourceFile URL so the PDF viewer can load it.
        const importedBook: Book =
          mime === BOOK_MIME_TYPE.PDF
            ? {
                id: generateUUID(),
                fileHash: hash,
                uploadTime: now,
                createTime: now,
                title,
                author: undefined,
                chapterList: [{ title, paragraphs: [''] }],
                toc: [{ title, index: 0 }],
                metadata: {
                  title,
                  sourceFile: {
                    data: `/api/books/file/${encodeURIComponent(filename)}`,
                    mediaType: mime,
                  },
                } as any,
              }
            : await processBook(buffer, mime, title, hash)

        // Prefer URL reference over embedding base64.
        const metadata = importedBook.metadata as unknown as Record<string, unknown>
        metadata.sourceFile = {
          data: `/api/books/file/${encodeURIComponent(filename)}`,
          mediaType: mime,
        }

        const normalized: Book = {
          ...importedBook,
          uploadTime: (importedBook as any).uploadTime ?? importedBook.createTime ?? now,
          createTime: importedBook.createTime ?? now,
          metadata: metadata as any,
          fileHash: hash,
        }

        if (!dryRun) {
          db.books.push(normalized)
        }

        existingByFileHash.add(hash)
        imported++
      }

      if (!dryRun) {
        await writeDB(db)
      }

      return NextResponse.json({ ok: true, imported, skipped, totalFiles: files.length, dryRun })
    } catch (e: unknown) {
      console.error('[api/books/import] failed', e)
      return NextResponse.json({ ok: false, error: (e as Error)?.message || String(e) }, { status: 500 })
    }
  })
}
