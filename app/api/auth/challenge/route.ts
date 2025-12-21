import { NextResponse } from 'next/server'
import { createChallenge, isAuthEnabled } from '@/app/api/_lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const { enabled, keys } = await isAuthEnabled()
    if (!enabled || keys.length === 0) {
      return NextResponse.json({ error: 'Auth not configured' }, { status: 503 })
    }

    const payload = await createChallenge()
    return NextResponse.json(payload)
  } catch (e: unknown) {
    console.error('[auth/challenge] GET failed', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
