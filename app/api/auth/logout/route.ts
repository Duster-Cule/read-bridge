import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, clearSessionCookie, revokeSession } from '@/app/api/_lib/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    let token: string | null = null

    if (authHeader) {
      const match = authHeader.match(/^Bearer\s+(.+)$/i)
      if (match) token = match[1].trim()
    }

    if (!token) {
      const cookieHeader = request.headers.get('cookie') || ''
      const parts = cookieHeader.split(';').map((part) => part.trim())
      for (const part of parts) {
        if (part.startsWith(`${AUTH_COOKIE_NAME}=`)) {
          token = decodeURIComponent(part.slice(`${AUTH_COOKIE_NAME}=`.length))
          break
        }
      }
    }

    if (token) {
      await revokeSession(token)
    }

    const response = NextResponse.json({ ok: true })
    response.headers.set('Set-Cookie', clearSessionCookie())
    return response
  } catch (e: unknown) {
    console.error('[auth/logout] POST failed', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
