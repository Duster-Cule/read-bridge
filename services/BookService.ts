import { BOOK_FORMAT } from '@/constants/book';
import type { BOOK_FORMAT_TYPE, FormattedBook } from '@/types/book';

import { initEpubBook } from '@/services/Epub';
import { saveToFile } from '@/services/Download'

export async function initBook(name: string, format: BOOK_FORMAT_TYPE, hash: string, size: number, buffer: Buffer) {
  let initFile: FormattedBook | null = null
  switch (format) {
    case BOOK_FORMAT.EPUB:
      initFile = initEpubBook(buffer)
      break
    // case BOOK_FORMAT.MD:
    //   return initMdBook(name, hash, size, buffer)
    // case BOOK_FORMAT.TXT:
    //   return initTxtBook(name, hash, size, buffer)
    default:
      throw new Error(`Unsupported book format: ${format}`)
  }
  // console.log(initFile)
  if (initFile) {
    await saveToFile(JSON.stringify(initFile), `${initFile.metadata.title}.json`)
  }
  return initFile
}

