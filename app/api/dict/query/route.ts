import path from 'node:path'
import Database from 'better-sqlite3'
import type { NextRequest } from 'next/server'
import { requireAuth } from '@/app/api/_lib/auth'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth) return auth

  const { searchParams } = new URL(req.url)
  const raw = searchParams.get('word') || ''
  const word = raw.trim()

  if (!word) {
    return Response.json({ ok: true, data: null })
  }

  // Keep db in repo for web mode.
  // NOTE: This path is dev-friendly; for production, you may want an env var.
  const dbPath = path.join(process.cwd(), 'src-tauri', 'resources', 'stardict.db')

  try {
    const db = new Database(dbPath, { readonly: true, fileMustExist: true })

    const sw = word.toLowerCase()

    const stmt = db.prepare(
      'SELECT word, phonetic, definition, translation, pos, collins, oxford, tag, bnc, frq, exchange FROM stardict WHERE word = ? OR sw = ? LIMIT 1'
    )

    const row = stmt.get(word, sw) as
      | {
          word: string
          phonetic: string | null
          definition: string | null
          translation: string | null
          pos: string | null
          collins: number | null
          oxford: number | null
          tag: string | null
          bnc: number | null
          frq: number | null
          exchange: string | null
        }
      | undefined

    db.close()

    if (!row) {
      return Response.json({ ok: true, data: null })
    }

    return Response.json({
      ok: true,
      data: {
        word: row.word,
        phonetic: row.phonetic || undefined,
        definition: row.definition || undefined,
        translation: row.translation || undefined,
        pos: row.pos || undefined,
        collins: row.collins ?? undefined,
        oxford: row.oxford ?? undefined,
        tag: row.tag || undefined,
        bnc: row.bnc ?? undefined,
        frq: row.frq ?? undefined,
        exchange: row.exchange || undefined
      }
    })
  } catch (e) {
    return Response.json(
      {
        ok: false,
        error: (e as Error)?.message || String(e)
      },
      { status: 500 }
    )
  }
}
