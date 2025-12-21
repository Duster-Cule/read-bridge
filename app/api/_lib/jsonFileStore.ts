import { promises as fs } from 'fs'
import path from 'path'

// Serialize writes within this Node.js process to avoid concurrent read-modify-write races.
let writeQueue: Promise<void> = Promise.resolve()

export function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(fn, fn)
  writeQueue = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    const parsed = JSON.parse(content) as unknown
    return (parsed ?? fallback) as T
  } catch (e: unknown) {
    if (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code?: unknown }).code === 'ENOENT'
    ) {
      return fallback
    }

    if (e instanceof SyntaxError) {
      try {
        const backupPath = `${filePath}.corrupt.${Date.now()}`
        await fs.rename(filePath, backupPath)
      } catch {
        // ignore
      }
      return fallback
    }

    throw e
  }
}

export async function writeJsonFileAtomic(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const tmpPath = `${filePath}.tmp.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}`
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8')
  await fs.rename(tmpPath, filePath)
}
