import { NextResponse } from 'next/server'

function firstHeaderValue(value) {
  if (!value) return null
  // handle "https, http" or similar
  return value.split(',')[0].trim() || null
}

function getRequestOrigin(request) {
  const proto = firstHeaderValue(request.headers.get('x-forwarded-proto'))
  const host = firstHeaderValue(request.headers.get('x-forwarded-host')) || request.headers.get('host')
  if (proto && host) return `${proto}://${host}`
  return request.url
}

function getLocalOrigin() {
  const port = process.env.PORT || '3000'
  return `http://127.0.0.1:${port}`
}

async function checkSession(url, cookieHeader) {
  let resp = await fetch(url, {
    headers: {
      cookie: cookieHeader,
    },
    cache: 'no-store',
    redirect: 'manual',
  })

  if ([301, 302, 307, 308].includes(resp.status)) {
    const location = resp.headers.get('location')
    if (location) {
      const redirectedUrl = new URL(location, url)
      resp = await fetch(redirectedUrl, {
        headers: {
          cookie: cookieHeader,
        },
        cache: 'no-store',
        redirect: 'manual',
      })
    }
  }

  return resp.ok
}

export async function proxy(request) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  let ok = false
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const localSessionUrl = new URL('/api/auth/session', getLocalOrigin())
    ok = await checkSession(localSessionUrl, cookieHeader)

    if (!ok) {
      const forwardedSessionUrl = new URL('/api/auth/session', getRequestOrigin(request))
      ok = await checkSession(forwardedSessionUrl, cookieHeader)
    }
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
