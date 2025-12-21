import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'

export const runtime = 'nodejs'

function guessExtension(fileName: string, mimeType: string): string {
  const ext = path.extname(fileName || '').toLowerCase()
  if (ext && /^\.[a-z0-9]+$/.test(ext)) return ext

  // Fallback: minimal mapping for our supported types
  switch (mimeType) {
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

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const hash = crypto.createHash('sha256').update(buffer).digest('hex')
    const ext = guessExtension(file.name, file.type)
    const filename = `${hash}${ext}`

    const dir = path.join(process.cwd(), 'books')
    await fs.mkdir(dir, { recursive: true })

    const filePath = path.join(dir, filename)

    // If file already exists (same hash), keep it.
    try {
      await fs.access(filePath)
    } catch {
      await fs.writeFile(filePath, buffer)
    }

    const url = `/api/books/file/${encodeURIComponent(filename)}`

    return NextResponse.json({ ok: true, hash, filename, url, mediaType: file.type || 'application/octet-stream' })
  } catch (e: unknown) {
    console.error('[books/upload] failed', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
