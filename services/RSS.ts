import { Book, PlainTextChapter, Metadata } from '@/types/book';
import { generateUUID } from '@/utils/uuid';

function textContent(el: Element | null): string {
  return (el?.textContent ?? '').trim();
}

function htmlToParagraphs(html: string): string[] {
  const trimmed = (html ?? '').trim();
  if (!trimmed) return [];

  // Works in browser (client components). RSS parsing runs on click.
  const dom = new DOMParser().parseFromString(trimmed, 'text/html');
  const paragraphs = Array.from(dom.querySelectorAll('p'))
    .map((p) => (p.textContent ?? '').trim())
    .filter(Boolean);

  if (paragraphs.length > 0) return paragraphs;
  const textOnly = (dom.body?.textContent ?? '').trim();
  return textOnly ? [textOnly] : [];
}

function parseRssOrAtom(xmlText: string): Book[] {
  const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
  const books: Book[] = [];

  const isAtom = xml.getElementsByTagName('entry').length > 0;
  const items = isAtom
    ? Array.from(xml.getElementsByTagName('entry'))
    : Array.from(xml.getElementsByTagName('item'));

  for (const item of items) {
    const title = textContent(item.getElementsByTagName('title')[0] ?? null) || 'Untitled';

    let link = '';
    if (isAtom) {
      const linkEl = Array.from(item.getElementsByTagName('link')).find((l) => {
        const rel = (l.getAttribute('rel') ?? '').toLowerCase();
        return rel === '' || rel === 'alternate';
      });
      link = (linkEl?.getAttribute('href') ?? '').trim();
    } else {
      link = textContent(item.getElementsByTagName('link')[0] ?? null);
    }

    const guid =
      textContent(item.getElementsByTagName('guid')[0] ?? null) ||
      (isAtom ? textContent(item.getElementsByTagName('id')[0] ?? null) : '') ||
      link ||
      title;

    const pubDate =
      textContent(item.getElementsByTagName('pubDate')[0] ?? null) ||
      (isAtom ? textContent(item.getElementsByTagName('updated')[0] ?? null) : '') ||
      (isAtom ? textContent(item.getElementsByTagName('published')[0] ?? null) : '');

    const author = (() => {
      if (isAtom) {
        const name = textContent(item.querySelector('author > name'));
        return name;
      }
      // RSS 2.0: dc:creator or author
      const dcCreator = textContent(item.getElementsByTagName('dc:creator')[0] ?? null);
      if (dcCreator) return dcCreator;
      return textContent(item.getElementsByTagName('author')[0] ?? null);
    })();

    const contentEncoded = textContent(item.getElementsByTagName('content:encoded')[0] ?? null);
    const description = textContent(item.getElementsByTagName('description')[0] ?? null);
    const summary = isAtom ? textContent(item.getElementsByTagName('summary')[0] ?? null) : '';
    const atomContent = isAtom ? textContent(item.getElementsByTagName('content')[0] ?? null) : '';

    const content = contentEncoded || atomContent || description || summary;
    const paragraphs = htmlToParagraphs(content);

    const chapter: PlainTextChapter = {
      title,
      paragraphs,
    };

    const metadata: Metadata = {
      title,
      author: author || 'RSS Feed',
      language: 'en',
      identifier: guid,
      date: pubDate,
      source: link,
    };

    const now = Date.now();
    books.push({
      id: generateUUID(),
      title,
      author: author || 'RSS Feed',
      fileHash: guid,
      uploadTime: now,
      createTime: now,
      chapterList: [chapter],
      toc: [{ title, index: 0 }],
      metadata,
    });
  }

  return books;
}

export async function fetchRSS(url: string): Promise<Book[]> {
  try {
    const proxyUrl = `/api/rss/proxy?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status} ${response.statusText}`);
    }
    const xmlText = await response.text();
    return parseRssOrAtom(xmlText);
  } catch (error) {
    console.error('Error fetching RSS:', error);
    throw error;
  }
}
