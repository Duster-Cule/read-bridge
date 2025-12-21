import { NextResponse } from 'next/server'
import { requireAuth } from '@/app/api/_lib/auth'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth) return auth
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    console.error('[auth/session] GET failed', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
