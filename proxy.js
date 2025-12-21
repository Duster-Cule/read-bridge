import { NextResponse } from 'next/server'

export async function proxy(request) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  const sessionUrl = new URL('/api/auth/session', request.url)
  let ok = false
  try {
    const resp = await fetch(sessionUrl, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
      cache: 'no-store',
    })
    ok = resp.ok
  } catch {
    ok = false
  }

  if (!ok) {
    const loginUrl = new URL('/login', request.url)
    const target = `${pathname}${request.nextUrl.search}`
    if (target && target !== '/login') {
      loginUrl.searchParams.set('next', target)
    }
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/|_next/|login|favicon.ico|favicon.svg|robots.txt|sitemap.xml|assets/).*)'],
}
