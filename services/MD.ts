import MarkdownIt from 'markdown-it'
import * as cheerio from 'cheerio';
import { FormattedBook, PlainTextChapter } from "@/types/book";
import { detectLanguage } from '@/utils/franc';

export function initMDBook(buffer: Buffer, name: string): FormattedBook {
  const md = new MarkdownIt()
  const mdString = buffer.toString()
  const html = md.render(mdString)
  const $ = cheerio.load(html)
  const title = $('h1').text() || name
  const language = detectLanguage(mdString.slice(0, 500))

  // 将h3和h4转换为普通段落
  $('h3, h4').each((_, elem) => {
    const content = $(elem).html() || ''
    $(elem).replaceWith(`<p>${content}</p>`)
  })

  const chapterList: PlainTextChapter[] = []

  // 找到所有h2元素
  const h2Elements = $('h2')

  if (h2Elements.length === 0) {
    // 如果没有h2元素，将整个内容作为一个章节
    const content = $('body').html() || ''
    // 把HTML内容转换为段落数组
    const paragraphs = extractParagraphs($, content)

    chapterList.push({
      title: title,
      paragraphs
    })
  } else {
    // 根据h2元素分割内容
    h2Elements.each((_, elem) => {
      const chapterTitle = $(elem).text()
      let content = ''

      // 获取当前h2元素
      const $elem = $(elem)

      // 获取当前h2到下一个h2之间的内容
      let $nextAll = $elem.nextAll()
      let $nextH2 = $nextAll.filter('h2').first()

      if ($nextH2.length > 0) {
        // 获取到下一个h2之前的所有元素
        let $contents = $nextAll.slice(0, $nextAll.index($nextH2))
        content = $contents.map((_, el) => $.html(el)).get().join('')
      } else {
        // 如果没有下一个h2，获取当前h2后面的所有内容
        content = $nextAll.map((_, el) => $.html(el)).get().join('')
      }

      // 把HTML内容转换为段落数组
      const paragraphs = extractParagraphs($, content)

      chapterList.push({
        title: chapterTitle,
        paragraphs
      })
    })
  }

  return {
    metadata: {
      title,
      language: language
    },
    chapterList
  }
}

/**
 * 从HTML内容中提取段落
 */
function extractParagraphs($: cheerio.CheerioAPI, htmlContent: string): string[] {
  const $content = cheerio.load(htmlContent)
  const paragraphs: string[] = []

  // 提取所有段落元素
  $content('p').each((_, elem) => {
    const text = $content(elem).text().trim()
    if (text) {
      paragraphs.push(text)
    }
  })

  // 处理其他可能的内容元素（如列表、引用等）
  $content('li, blockquote').each((_, elem) => {
    const text = $content(elem).text().trim()
    if (text) {
      paragraphs.push(text)
    }
  })

  return paragraphs
}
