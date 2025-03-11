import { BOOK_FORMAT } from '@/constants/book';
import type { BOOK_FORMAT_TYPE, FormattedBook } from '@/types/book';

import { initEpubBook } from '@/services/Epub';
import type { Book } from '@/types/book';
import { saveToFile } from '@/services/Download'

/**
 * 处理书籍
 * @param buffer 书籍缓冲区
 * @param format 书籍格式
 * @param name 书籍名称
 * @param hash 书籍哈希值
 * @returns 完成处理书籍
 * @throws 
 */
export async function processBook(buffer: Buffer, format: BOOK_FORMAT_TYPE, name: string, hash: string): Promise<Book> {
  let initFile: FormattedBook | null = null
  try {
    switch (format) {
      case BOOK_FORMAT.EPUB:
        initFile = initEpubBook(buffer)
        break
      default:
        throw new Error(`Unsupported book format: ${format}`)
    }
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error(String(error))
  }

  const book = createBookModel(initFile, hash)
  if (initFile) {
    await saveToFile(JSON.stringify(book), `${initFile.metadata.title}.json`)
  }
  return book
}

function createBookModel(formattedBook: FormattedBook, hash: string): Book {
  return {
    id: crypto.randomUUID(),
    fileHash: hash,
    createTime: Date.now(),
    title: formattedBook.metadata.title,
    author: formattedBook.metadata.author,
    chapterList: formattedBook.chapterList,
    toc: formattedBook.chapterList.map((chapter, index) => ({
      title: chapter.title,
      index
    })),
    metadata: formattedBook.metadata
  }
}