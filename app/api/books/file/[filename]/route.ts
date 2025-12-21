import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export const runtime = 'nodejs'

function isSafeBookFilename(filename: string): boolean {
  // sha256 hex + optional extension like .pdf/.txt/.epub/.md
  return /^[a-f0-9]{64}(\.[a-z0-9]+)?$/i.test(filename)
}

function contentTypeFromExt(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  switch (ext) {
    case '.pdf':
      return 'application/pdf'
    case '.txt':
      return 'text/plain; charset=utf-8'
    case '.md':
      return 'text/markdown; charset=utf-8'
    case '.epub':
      return 'application/epub+zip'
    default:
      return 'application/octet-stream'
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params
    if (!filename || !isSafeBookFilename(filename)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), 'books', filename)

    let data: Buffer
    try {
      data = await fs.readFile(filePath)
    } catch {
      // Avoid leaking paths
      return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }

    const contentType = contentTypeFromExt(filename)
    const body = data as unknown as BodyInit

    return new Response(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (e: unknown) {
    console.error('[books/file] failed', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
