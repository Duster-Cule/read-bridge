import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isHttpUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url || !isHttpUrl(url)) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  try {
    const resp = await fetch(url, {
      headers: {
        // Some RSS providers reject empty/unknown UA.
        'User-Agent': 'read-bridge/0.1 (+https://localhost)',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
      cache: 'no-store',
    });

    if (!resp.ok) {
      return NextResponse.json(
        { error: `Upstream fetch failed: ${resp.status} ${resp.statusText}` },
        { status: 502 }
      );
    }

    const text = await resp.text();

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 502 });
  }
}
