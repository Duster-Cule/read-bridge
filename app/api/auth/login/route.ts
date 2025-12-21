import { NextResponse } from 'next/server'
import {
  buildSessionCookie,
  consumeChallenge,
  createSession,
  findPublicKeyRecord,
  isAuthEnabled,
  verifySignature,
} from '@/app/api/_lib/auth'

export const runtime = 'nodejs'

type LoginBody = {
  challenge?: unknown
  signature?: unknown
  keyId?: unknown
  publicKey?: unknown
}

export async function POST(request: Request) {
  try {
    const { enabled, keys } = await isAuthEnabled()
    if (!enabled || keys.length === 0) {
      return NextResponse.json({ error: 'Auth not configured' }, { status: 503 })
    }

    const body = (await request.json().catch(() => null)) as LoginBody | null
    const challenge = typeof body?.challenge === 'string' ? body.challenge : null
    const signature = typeof body?.signature === 'string' ? body.signature : null
    const keyId = typeof body?.keyId === 'string' ? body.keyId : null
    const publicKey = typeof body?.publicKey === 'string' ? body.publicKey : null

    if (!challenge || !signature || (!keyId && !publicKey)) {
      return NextResponse.json({ error: 'Invalid login payload' }, { status: 400 })
    }

    const challengeValid = await consumeChallenge(challenge)
    if (!challengeValid) {
      return NextResponse.json({ error: 'Invalid or expired challenge' }, { status: 400 })
    }

    const record = await findPublicKeyRecord({ keyId, publicKey })
    if (!record) {
      return NextResponse.json({ error: 'Unknown key' }, { status: 401 })
    }

    const valid = verifySignature(record.publicKey, challenge, signature)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const session = await createSession(record.id)
    const response = NextResponse.json({
      ok: true,
      token: session.token,
      expiresAt: session.expiresAt,
      keyId: session.keyId,
    })
    response.headers.set('Set-Cookie', buildSessionCookie(session.token, session.expiresAt))
    return response
  } catch (e: unknown) {
    console.error('[auth/login] POST failed', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
