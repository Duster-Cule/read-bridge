import * as cheerio from 'cheerio';

import type { AnyNode } from 'domhandler';
import { unzipSync, strFromU8 } from 'fflate';


interface EpubMetadata {
  title: string; // 书名
  author?: string; // 作者
  publisher?: string; // 出版社
  date?: string; // 出版日期
  rights?: string; // 版权信息
  identifier: string; // 图书唯一标识符
  language?: string; // 语言代码
}

interface EpubManifestItem {
  id: string;
  href: string;
  mediaType: string;
}

type EpubSpineBody = string[];

type EpubManifestBody = EpubManifestItem[];


export async function initEpubBook(buffer: Buffer) {
  const unzipped = unzipSync(new Uint8Array(buffer));

  const containerXML = strFromU8(unzipped['META-INF/container.xml'])
  const $container = cheerio.load(containerXML, { xml: true })
  const fullPath = $container('rootfile').attr('full-path')

  if (!fullPath) {
    throw new Error('Full path not found')
  }

  const $content = cheerio.load(strFromU8(unzipped[fullPath]), { xml: true })

  const $metadata = $content('metadata:first')
  const metadata = initMetadata($metadata)
  console.log(metadata)

  const $manifest = $content('manifest')
  const manifest = initManifest($manifest)
  console.log(manifest)

  const $spine = $content('spine')
  const spine = initSpine($spine)
  console.log(spine)

  const sortChapters: EpubManifestBody = spine.map((id) => {
    const item = manifest.find((item) => item.id === id)
    if (!item) {
      throw new Error(`Manifest item not found: ${id}`)
    }
    return item
  })

  const chapterXMLs = sortChapters.map((item) => {
    const possiblePrefixes = ['OEBPS/', 'EPUB/', '']
    let contentXML = ''

    for (const prefix of possiblePrefixes) {
      const fullPath = prefix + item.href
      if (fullPath in unzipped) {
        contentXML = strFromU8(unzipped[fullPath])
        break
      }
    }

    if (contentXML === '') {
      throw new Error(`Content file not found: ${item.href}`)
    }

    return contentXML
  })

  console.log(chapterXMLs)
}

function initMetadata($metadata: cheerio.Cheerio<AnyNode>): EpubMetadata {
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

  return {
    title: getMetaTag(metaTags.title),
    author: getMetaTag(metaTags.author),
    publisher: getMetaTag(metaTags.publisher),
    date: getMetaTag(metaTags.date),
    rights: getMetaTag(metaTags.rights),
    identifier: getMetaTag(metaTags.identifier),
    language: getMetaTag(metaTags.language),
  }
}

function initManifest($manifest: cheerio.Cheerio<AnyNode>): EpubManifestBody {
  const items: EpubManifestBody = [];

  $manifest.find('item').each((_, element) => {
    const id = element.attribs['id'];
    const href = element.attribs['href'];
    const mediaType = element.attribs['media-type'];

    if (id && href && mediaType) {
      items.push({ id, href, mediaType });
    }
  });

  // 只返回 HTML/XHTML 类型的内容
  return items.filter(item =>
    item.mediaType.includes('application/xhtml+xml') ||
    item.mediaType.includes('text/html')
  );
}

function initSpine($spine: cheerio.Cheerio<AnyNode>): EpubSpineBody {
  const spineItems: string[] = [];

  $spine.find('itemref').each((_, element) => {
    const idref = element.attribs['idref'];
    if (idref) {
      spineItems.push(idref);
    }
  });

  return spineItems;
}
