import * as cheerio from 'cheerio';

import type { AnyNode } from 'domhandler';
import { unzipSync, strFromU8, Unzipped } from 'fflate';

import type { FormattedBook, PlainTextChapter, Metadata, Resource } from '@/types/book';


interface EpubManifestItem {
  id: string;
  href: string;
  mediaType: string;
}

type EpubSpineList = string[];

type EpubManifestList = EpubManifestItem[];


/**
 * 初始化 Epub 书籍
 * @param buffer - Epub 文件的 Buffer 对象
 * @returns 格式化后的书籍对象 {
 *  metadata: Metadata,
 *  chapterList: PlainTextChapter[]
 * }
 */
export function initEpubBook(buffer: Buffer): FormattedBook {
  if (!isValidEpub(buffer)) {
    throw new Error('Invalid EPUB format');
  }

  const unzipped: Unzipped = unzipSync(new Uint8Array(buffer));
  const commonPrefix = getPrefixes(unzipped)
  const containerXML = strFromU8(unzipped['META-INF/container.xml'])
  const $container = cheerio.load(containerXML, { xml: true })
  const fullPath = $container('rootfile').attr('full-path')

  if (!fullPath) {
    throw new Error('Full path not found')
  }

  const $content = cheerio.load(strFromU8(unzipped[fullPath]), { xml: true })

  const $metadata = $content('metadata:first')
  const metadata = initMetadata($metadata, unzipped)

  const $manifest = $content('manifest')
  const manifest = initManifest($manifest)

  const $spine = $content('spine')
  const spine = initSpine($spine)


  const sortChapters: EpubManifestList = spine.map((id) => {
    const item = manifest.find((item) => item.id === id)
    if (!item) {
      throw new Error(`Manifest item not found: ${id}`)
    }
    return item
  })

  const chapterXMLs = sortChapters.map((item) => {
    const possiblePrefixesList = [commonPrefix, 'OEBPS/', 'EPUB/', 'OPS/', '']
    let contentXML = ''

    for (const prefix of possiblePrefixesList) {
      const fullPath = prefix + item.href
      if (fullPath in unzipped) {
        contentXML = strFromU8(unzipped[fullPath])
        break
      }
    }

    if (contentXML === '') {
      console.error(`Content file not found: ${item.href}`)
    }

    return contentXML
  })

  const chapterList: PlainTextChapter[] = []
  let chapterCounter = 1
  for (const item of chapterXMLs) {
    const $ = cheerio.load(item, { xml: true })
    const originalTitle = $('h1').first().text() ||
      $('title').first().text() ||
      $('h2').first().text() ||
      '';
    if (!originalTitle || originalTitle === '') continue
    const paragraphs: string[] = []
    $('p').each((_, p) => {
      const text = $(p).text()
      if (text.trim() !== '') {
        paragraphs.push(text)
      }
    })

    if (paragraphs.length === 0) continue

    let finalTitle: string;
    if (originalTitle.toLowerCase() === 'unknown') {
      finalTitle = String(chapterCounter);
    } else {
      finalTitle = originalTitle;
    }

    chapterList.push({
      title: finalTitle,
      paragraphs
    })

    chapterCounter++;
  }

  // 空章节
  if (chapterList.length === 0) {
    chapterList.push({
      title: '书籍获取章节失败',
      paragraphs: [Object.keys(unzipped).join('\n')]
    })
  }

  return {
    metadata: metadata as FormattedBook['metadata'],
    chapterList
  }
}

function initMetadata($metadata: cheerio.Cheerio<AnyNode>, unzipped: Unzipped): Metadata {
  const metaTags = {
    title: ['dc\\:title', 'title'],
    author: ['dc\\:creator', 'creator'],
    publisher: ['dc\\:publisher', 'publisher'],
    date: ['dc\\:date', 'date'],
    rights: ['dc\\:rights', 'rights'],
    identifier: ['dc\\:identifier', 'identifier'],
    language: ['dc\\:language', 'language']
  };
  function getMetaTag(metaTags: string[]): string {
    for (const tag of metaTags) {
      const metaTag = $metadata.find(tag)
      if (metaTag.length > 0) {
        return metaTag.text()
      }
    }
    return ''
  }
  function getCover(unzipped: Unzipped): Resource | undefined {
    const mimeTypes: {
      [key: string]: string
    } = {
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    }

    const coverPatterns = [
      /.*cover.*\.(jpe?g|png|gif|webp)$/i,
      /\.(jpe?g|png|gif|webp)$/i,
      /cover/i
    ]

    for (const pattern of coverPatterns) {
      const coverUrl = Object.keys(unzipped).find(key => pattern.test(key))
      if (coverUrl) {
        const ext = coverUrl.split('.').pop()?.toLowerCase() || 'jpeg'
        return {
          data: Buffer.from(unzipped[coverUrl].buffer).toString('base64'),
          mediaType: mimeTypes[ext] || 'image/jpeg'
        }
      }
    }

    return undefined
  }

  return {
    title: getMetaTag(metaTags.title),
    author: getMetaTag(metaTags.author),
    publisher: getMetaTag(metaTags.publisher),
    date: getMetaTag(metaTags.date),
    rights: getMetaTag(metaTags.rights),
    identifier: getMetaTag(metaTags.identifier),
    language: getMetaTag(metaTags.language),
    cover: getCover(unzipped)
  }
}

function initManifest($manifest: cheerio.Cheerio<AnyNode>): EpubManifestList {
  const items: EpubManifestList = [];

  $manifest.find('item').each((_, element) => {
    const id = element.attribs['id'];
    const href = element.attribs['href'];
    const mediaType = element.attribs['media-type'];

    if (id && href && mediaType) {
      items.push({ id, href, mediaType });
    }
  });

  // 只返回 HTML/XHTML 类型的内容
  return items.filter(item => {
    return (
      item.mediaType.includes('application/xhtml+xml') ||
      item.mediaType.includes('text/html')
    )
  }
  );
}

function initSpine($spine: cheerio.Cheerio<AnyNode>): EpubSpineList {
  const spineItems: string[] = [];

  $spine.find('itemref').each((_, element) => {
    const idref = element.attribs['idref'];
    if (idref) {
      spineItems.push(idref);
    }
  });

  return spineItems;
}

function isValidEpub(buffer: Buffer): boolean {
  const signature = buffer.subarray(0, 4).toString('hex');
  if (signature !== '504b0304') {
    return false;
  }
  return true;
}

function getPrefixes(zip: Unzipped) {
  const paths = Object.keys(zip);
  const prefixCandidates: string[] = [];

  for (const path of paths) {
    // 跳过META-INF目录和mimetype文件
    if (path.startsWith('META-INF/') || path === 'mimetype') {
      continue;
    }

    const parts = path.split('/');
    // 防止无前缀路径情况
    if (parts.length > 2) {
      // 只取第一层
      const prefix = parts[0] + '/';
      prefixCandidates.push(prefix);
    }
  }

  // 统计数量
  const prefixCount = new Map<string, number>();

  for (const prefix of prefixCandidates) {
    prefixCount.set(prefix, (prefixCount.get(prefix) || 0) + 1);
  }

  const mostCommonPrefix = [...prefixCount.entries()].reduce(
    (max, [prefix, count]) => count > max[1] ? [prefix, count] : max,
    ['', 0]
  )[0];

  return mostCommonPrefix;
}