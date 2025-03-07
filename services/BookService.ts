import { BOOK_FORMAT } from '@/constants/book';
import type { BOOK_FORMAT_TYPE } from '@/types/book';

import { initEpubBook } from '@/services/Epub';

export function initBook(name: string, format: BOOK_FORMAT_TYPE, hash: string, size: number, buffer: Buffer) {
  const initFile = null
  switch (format) {
    case BOOK_FORMAT.EPUB:
      initEpubBook(buffer)
      break
    // case BOOK_FORMAT.MD:
    //   return initMdBook(name, hash, size, buffer)
    // case BOOK_FORMAT.TXT:
    //   return initTxtBook(name, hash, size, buffer)
    default:
      throw new Error(`Unsupported book format: ${format}`)
  }
  // console.log(initFile)
  return initFile
}

