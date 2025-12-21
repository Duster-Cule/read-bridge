import path from 'path'
import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { readJsonFile, withWriteLockFor, writeJsonFileAtomic } from '@/app/api/_lib/jsonFileStore'

type PublicKeyRecord = {
  id: string
  publicKey: string
  label?: string
  createdAt?: number
}

type PublicKeyDB = { keys: PublicKeyRecord[] }

type Challenge = { id: string; createdAt: number; expiresAt: number }
type ChallengeDB = { challenges: Challenge[] }

type Session = { token: string; keyId: string; createdAt: number; expiresAt: number }
type SessionDB = { sessions: Session[] }

const AUTH_COOKIE_NAME = 'rb_session'
const DEFAULT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
const DEFAULT_CHALLENGE_TTL_MS = 5 * 60 * 1000

function dataDir(): string {
  return process.env.READ_BRIDGE_DATA_DIR || path.join(process.cwd(), '.data')
}

function keysPath(): string {
  return process.env.READ_BRIDGE_AUTH_KEYS_PATH || path.join(dataDir(), 'auth-public-keys.json')
}

function sessionsPath(): string {
  return process.env.READ_BRIDGE_AUTH_SESSIONS_PATH || path.join(dataDir(), 'auth-sessions.json')
}

function challengesPath(): string {
  return process.env.READ_BRIDGE_AUTH_CHALLENGES_PATH || path.join(dataDir(), 'auth-challenges.json')
}

function readNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function authRequired(): boolean {
  return process.env.READ_BRIDGE_AUTH_REQUIRED === 'true'
}

function normalizeKey(value: string): string {
  return value.trim()
}

async function readPublicKeys(): Promise<PublicKeyRecord[]> {
  const raw = await readJsonFile<PublicKeyDB>(keysPath(), { keys: [] })
  const keys = Array.isArray(raw?.keys) ? raw.keys : []
  return keys.filter((key) => key && typeof key.id === 'string' && typeof key.publicKey === 'string')
}

export async function isAuthEnabled(): Promise<{ enabled: boolean; keys: PublicKeyRecord[]; required: boolean }> {
  const required = authRequired()
  const keys = await readPublicKeys()
  return { enabled: required || keys.length > 0, keys, required }
}

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {}
  return header.split(';').reduce((acc, part) => {
    const [name, ...rest] = part.trim().split('=')
    if (!name) return acc
    acc[name] = decodeURIComponent(rest.join('='))
    return acc
  }, {} as Record<string, string>)
}

function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i)
    if (match) return match[1].trim()
  }

  const cookies = parseCookies(request.headers.get('cookie'))
  return cookies[AUTH_COOKIE_NAME] || null
}

function pruneExpired<T extends { expiresAt: number }>(items: T[], now: number): T[] {
  return items.filter((item) => item.expiresAt > now)
}

async function readSessions(): Promise<Session[]> {
  const raw = await readJsonFile<SessionDB>(sessionsPath(), { sessions: [] })
  const sessions = Array.isArray(raw?.sessions) ? raw.sessions : []
  return sessions.filter(
    (session) =>
      session &&
      typeof session.token === 'string' &&
      typeof session.keyId === 'string' &&
      typeof session.expiresAt === 'number'
  )
}

async function writeSessions(sessions: Session[]): Promise<void> {
  await writeJsonFileAtomic(sessionsPath(), { sessions })
}

async function readChallenges(): Promise<Challenge[]> {
  const raw = await readJsonFile<ChallengeDB>(challengesPath(), { challenges: [] })
  const challenges = Array.isArray(raw?.challenges) ? raw.challenges : []
  return challenges.filter(
    (challenge) =>
      challenge && typeof challenge.id === 'string' && typeof challenge.expiresAt === 'number'
  )
}

async function writeChallenges(challenges: Challenge[]): Promise<void> {
  await writeJsonFileAtomic(challengesPath(), { challenges })
}

export async function requireAuth(request: Request): Promise<NextResponse | null> {
  const { enabled, keys, required } = await isAuthEnabled()
  if (!enabled) return null
  if (required && keys.length === 0) {
    return NextResponse.json({ error: 'Auth keys not configured' }, { status: 503 })
  }

  const token = getAuthToken(request)
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = await validateSession(token)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

export async function validateSession(token: string): Promise<Session | null> {
  const now = Date.now()
  return withWriteLockFor(sessionsPath(), async () => {
    const sessions = await readSessions()
    const pruned = pruneExpired(sessions, now)
    if (pruned.length !== sessions.length) {
      await writeSessions(pruned)
    }

    return pruned.find((session) => session.token === token) ?? null
  })
}

function randomId(bytes: number): string {
  return crypto.randomBytes(bytes).toString('base64url')
}

export async function createChallenge(): Promise<{ challenge: string; expiresAt: number }> {
  const now = Date.now()
  const challenge = randomId(32)
  const ttl = readNumberEnv('READ_BRIDGE_AUTH_CHALLENGE_TTL_MS', DEFAULT_CHALLENGE_TTL_MS)
  const expiresAt = now + ttl

  await withWriteLockFor(challengesPath(), async () => {
    const challenges = await readChallenges()
    const pruned = pruneExpired(challenges, now)
    pruned.push({ id: challenge, createdAt: now, expiresAt })
    await writeChallenges(pruned)
  })

  return { challenge, expiresAt }
}

export async function consumeChallenge(challenge: string): Promise<boolean> {
  const now = Date.now()
  return withWriteLockFor(challengesPath(), async () => {
    const challenges = await readChallenges()
    const pruned = pruneExpired(challenges, now)
    const remaining = pruned.filter((item) => item.id !== challenge)
    if (remaining.length === pruned.length) return false
    await writeChallenges(remaining)
    return true
  })
}

export async function findPublicKeyRecord(input: {
  keyId?: string | null
  publicKey?: string | null
}): Promise<PublicKeyRecord | null> {
  const keys = await readPublicKeys()
  const keyId = typeof input.keyId === 'string' ? input.keyId : null
  const publicKey = typeof input.publicKey === 'string' ? normalizeKey(input.publicKey) : null

  if (keyId) {
    return keys.find((key) => key.id === keyId) ?? null
  }

  if (publicKey) {
    return keys.find((key) => normalizeKey(key.publicKey) === publicKey) ?? null
  }

  return null
}

function decodeSignature(signature: string): Buffer | null {
  if (!signature) return null
  const normalized = signature.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  try {
    return Buffer.from(padded, 'base64')
  } catch {
    return null
  }
}

export function verifySignature(publicKey: string, challenge: string, signature: string): boolean {
  const sig = decodeSignature(signature)
  if (!sig) return false

  const data = Buffer.from(challenge, 'utf8')
  const key = normalizeKey(publicKey)

  try {
    if (crypto.verify(null, data, key, sig)) return true
  } catch {
    // Fall through for non-Ed25519 keys.
  }

  try {
    return crypto.verify('sha256', data, key, sig)
  } catch {
    return false
  }
}

export async function createSession(keyId: string): Promise<Session> {
  const now = Date.now()
  const ttl = readNumberEnv('READ_BRIDGE_AUTH_SESSION_TTL_MS', DEFAULT_SESSION_TTL_MS)
  const session: Session = {
    token: randomId(32),
    keyId,
    createdAt: now,
    expiresAt: now + ttl,
  }

  await withWriteLockFor(sessionsPath(), async () => {
    const sessions = await readSessions()
    const pruned = pruneExpired(sessions, now)
    pruned.push(session)
    await writeSessions(pruned)
  })

  return session
}

export async function revokeSession(token: string): Promise<boolean> {
  return withWriteLockFor(sessionsPath(), async () => {
    const sessions = await readSessions()
    const remaining = sessions.filter((session) => session.token !== token)
    if (remaining.length === sessions.length) return false
    await writeSessions(remaining)
    return true
  })
}

export function buildSessionCookie(token: string, expiresAt: number): string {
  const parts = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${new Date(expiresAt).toUTCString()}`,
  ]
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure')
  }
  return parts.join('; ')
}

export function clearSessionCookie(): string {
  return `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

export { AUTH_COOKIE_NAME }
