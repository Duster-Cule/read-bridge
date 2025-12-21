'use client'

import legacyDb from '@/services/DBIndexed'
import db, { HttpError } from '@/services/DB'
import type { Book } from '@/types/book'

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

function pickExtension(mediaType: string): string {
  switch (mediaType) {
    case 'application/pdf':
      return '.pdf'
    case 'text/plain':
      return '.txt'
    case 'text/markdown':
      return '.md'
    case 'application/epub+zip':
      return '.epub'
    default:
      return ''
  }
}

function hasUrlLikeData(data: string): boolean {
  return data.startsWith('/') || data.startsWith('http://') || data.startsWith('https://')
}

function getSourceFile(book: Book): { data?: unknown; mediaType?: unknown } | null {
  const metadata = book.metadata as unknown as Record<string, unknown>
  const sourceFile = metadata.sourceFile as { data?: unknown; mediaType?: unknown } | undefined
  return sourceFile ?? null
}

async function uploadFileToBooksDir(file: File): Promise<{ url: string } | null> {
  const formData = new FormData()
  formData.append('file', file)

  const resp = await fetch('/api/books/upload', {
    method: 'POST',
    body: formData,
  })

  if (!resp.ok) return null
  const json = (await resp.json().catch(() => null)) as { url?: unknown } | null
  if (!json || typeof json.url !== 'string') return null
  return { url: json.url }
}

/**
 * Migrate existing IndexedDB books to server-side `books/` directory.
 * - For PDF: if legacy base64 exists, upload original bytes.
 * - For TXT: reconstruct from paragraphs and upload.
 * After upload, sets `book.metadata.sourceFile = { data: url, mediaType }`.
 */
export async function migrateBooksToBooksDir(options?: { dryRun?: boolean }): Promise<{
  total: number
  migrated: number
  skipped: number
  failed: number
}> {
  const dryRun = Boolean(options?.dryRun)

  const books = await legacyDb.getAllBooks(false)
  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const book of books) {
    const sourceFile = getSourceFile(book)
    const mediaType = typeof sourceFile?.mediaType === 'string' ? sourceFile.mediaType : null
    const data = typeof sourceFile?.data === 'string' ? sourceFile.data : null

    // Already migrated (URL stored)
    if (data && hasUrlLikeData(data)) {
      skipped++
      continue
    }

    // Only handle PDF/TXT reliably for now.
    const isPdf = mediaType === 'application/pdf'
    const isTxt = mediaType === 'text/plain' || (!mediaType && Array.isArray(book.chapterList))

    let fileToUpload: File | null = null

    if (isPdf) {
      if (!data) {
        failed++
        continue
      }
      // Legacy stored base64
      const bytes = base64ToUint8Array(data)
      const ext = pickExtension('application/pdf')
      fileToUpload = new File([bytes as unknown as Uint8Array<ArrayBuffer>], `${book.title || book.id}${ext}`, { type: 'application/pdf' })
    } else if (isTxt) {
      const ext = pickExtension('text/plain')
      const content = book.chapterList?.[0]?.paragraphs?.join('\n') ?? ''
      fileToUpload = new File([content], `${book.title || book.id}${ext}`, { type: 'text/plain' })
    } else {
      skipped++
      continue
    }

    try {
      if (dryRun) {
        migrated++
        continue
      }

      const uploaded = await uploadFileToBooksDir(fileToUpload)
      if (!uploaded) {
        failed++
        continue
      }

      const metadata = book.metadata as unknown as Record<string, unknown>
      metadata.sourceFile = {
        data: uploaded.url,
        mediaType: mediaType ?? (isPdf ? 'application/pdf' : 'text/plain'),
      }

      const now = Date.now()
      const bookToPersist: Book = {
        ...book,
        uploadTime: (book as any).uploadTime ?? book.createTime ?? now,
        createTime: book.createTime ?? now,
        metadata: metadata as any,
      }

      try {
        await db.addBook(bookToPersist)
      } catch (e) {
        // If already exists (same fileHash), update the existing server record's metadata.
        if (e instanceof HttpError && e.status === 409 && bookToPersist.fileHash) {
          const serverBooks = await db.getAllBooks(false)
          const existing = serverBooks.find((b) => b.fileHash === bookToPersist.fileHash)
          if (existing) {
            await db.updateBook(existing.id, {
              ...existing,
              metadata: bookToPersist.metadata,
            })
          } else {
            failed++
            continue
          }
        } else {
          failed++
          continue
        }
      }

      migrated++
    } catch {
      failed++
    }
  }

  return { total: books.length, migrated, skipped, failed }
}
