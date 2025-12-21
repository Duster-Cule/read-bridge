import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { requireAuth } from '@/app/api/_lib/auth'

export const runtime = 'nodejs'

type KVFile = Record<string, string>

// Serialize writes within this Node.js process to avoid concurrent read-modify-write races.
let writeQueue: Promise<void> = Promise.resolve()

function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(fn, fn)
  writeQueue = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

function getKVFilePath(): string {
  // Keep it local & deterministic for dev/server runs.
  // For Tauri production builds this route is not used.
  const base = process.env.READ_BRIDGE_DATA_DIR || path.join(process.cwd(), '.data')
  return path.join(base, 'settings-kv.json')
}

async function readKVFile(): Promise<KVFile> {
  const filePath = getKVFilePath()
  try {
    const content = await fs.readFile(filePath, 'utf8')
    const parsed = JSON.parse(content) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as KVFile
  } catch (e: unknown) {
    if (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code?: unknown }).code === 'ENOENT'
    ) {
      return {}
    }

    // If the file is corrupted (invalid JSON), back it up and recover.
    if (e instanceof SyntaxError) {
      try {
        const backupPath = `${filePath}.corrupt.${Date.now()}`
        await fs.rename(filePath, backupPath)
      } catch (renameError) {
        console.error('[settings/kv] failed to backup corrupt kv file', renameError)
      }
      return {}
    }
    throw e
  }
}

async function writeKVFile(data: KVFile): Promise<void> {
  const filePath = getKVFilePath()
  await fs.mkdir(path.dirname(filePath), { recursive: true })

  const tmpPath = `${filePath}.tmp.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}`
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8')
  await fs.rename(tmpPath, filePath)
}

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth) return auth

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    if (!key) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 })
    }

    const data = await readKVFile()
    const value = Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null
    return NextResponse.json({ value })
  } catch (e: unknown) {
    console.error('[settings/kv] GET failed', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  return withWriteLock(async () => {
    try {
      const auth = await requireAuth(request)
      if (auth) return auth

      const body = (await request.json().catch(() => null)) as { key?: unknown; value?: unknown } | null
      const key = typeof body?.key === 'string' ? body.key : null
      const value = typeof body?.value === 'string' ? body.value : null

      if (!key || value == null) {
        return NextResponse.json({ error: 'Invalid key/value' }, { status: 400 })
      }

      const data = await readKVFile()
      data[key] = value
      await writeKVFile(data)

      return NextResponse.json({ ok: true })
    } catch (e: unknown) {
      console.error('[settings/kv] PUT failed', e)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  })
}

export async function DELETE(request: Request) {
  return withWriteLock(async () => {
    try {
      const auth = await requireAuth(request)
      if (auth) return auth

      const body = (await request.json().catch(() => null)) as { key?: unknown } | null
      const key = typeof body?.key === 'string' ? body.key : null
      if (!key) {
        return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
      }

      const data = await readKVFile()
      delete data[key]
      await writeKVFile(data)

      return NextResponse.json({ ok: true })
    } catch (e: unknown) {
      console.error('[settings/kv] DELETE failed', e)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  })
}
