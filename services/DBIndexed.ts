// Legacy client-side DB (IndexedDB via Dexie).
// Kept only for one-time migration of existing browser data.

import Dexie, { Table } from 'dexie'
import { Book, BookPreview, ReadingProgress } from '@/types/book'
import nlp from 'compromise'

const DB_SEARCH_KEYS = ['&id', 'title', 'fileHash', 'author', 'createTime', 'lastReadTime', 'metadata.identifier', 'metadata.language']
const READING_PROGRESS_KEYS = ['&bookId', 'lastReadTime', 'currentLocation']

function normalizeBookUploadTime(book: Book): Book {
  if (book.uploadTime == null) {
    return {
      ...book,
      uploadTime: book.createTime ?? Date.now(),
    }
  }
  return book
}

class BookDB extends Dexie {
  books!: Table<Book>
  readingProgress!: Table<ReadingProgress>

  constructor() {
    super('book-reader')
    this.version(1).stores({
      books: DB_SEARCH_KEYS.join(','),
      readingProgress: READING_PROGRESS_KEYS.join(','),
    })
  }

  async addBook(book: Book): Promise<string> {
    const exists = await this.books.where('fileHash').equals(book.fileHash).first()
    if (exists) throw new Error('Book already exists')
    const id = await this.books.add(book)
    await this.addReadingProgress(id)
    return id
  }

  async getBook(id: string): Promise<Book | null> {
    const book = (await this.books.get(id)) ?? null
    if (!book) return null
    const normalized = normalizeBookUploadTime(book)
    if (book.uploadTime == null) {
      await this.books.update(id, { uploadTime: normalized.uploadTime } as Partial<Book>)
    }
    return normalized
  }

  async getAllBooks(reverse = true): Promise<Book[]> {
    const books = (await this.books.toArray()).map(normalizeBookUploadTime)

    const bookIds = books.map((b) => b.id)
    const progressList = await this.readingProgress.where('bookId').anyOf(bookIds).toArray()

    const lastReadTimeMap = new Map<string, number>()
    progressList.forEach((p) => lastReadTimeMap.set(p.bookId, p.lastReadTime))

    return books.sort((a, b) => {
      const timeA = lastReadTimeMap.get(a.id) ?? a.uploadTime ?? a.createTime ?? 0
      const timeB = lastReadTimeMap.get(b.id) ?? b.uploadTime ?? b.createTime ?? 0
      return reverse ? timeB - timeA : timeA - timeB
    })
  }

  async getAllBooksPreview(): Promise<BookPreview[]> {
    const books = await this.getAllBooks()
    return getBookPreview(books)
  }

  async deleteBook(id: string): Promise<void> {
    const exists = await this.books.get(id)
    if (!exists) throw new Error('Book not found')
    await this.books.delete(id)
    await this.readingProgress.delete(id)
  }

  async addReadingProgress(bookId: string): Promise<ReadingProgress> {
    const exists = await this.readingProgress.get(bookId)
    if (exists) return exists
    const defaultReadingProgress: ReadingProgress = {
      bookId,
      lastReadTime: Date.now(),
      currentLocation: { chapterIndex: 0, lineIndex: 0 },
      sentenceChapters: {},
    }
    await this.readingProgress.add(defaultReadingProgress)
    return defaultReadingProgress
  }

  async resetReadingProgress(bookId: string): Promise<void> {
    try {
      await this.readingProgress.delete(bookId)
    } finally {
      await this.addReadingProgress(bookId)
    }
  }

  async updateCurrentLocation(bookId: string, currentLocation: ReadingProgress['currentLocation']): Promise<void> {
    const exists = await this.readingProgress.get(bookId)
    if (!exists) throw new Error('Reading progress not found')
    await this.readingProgress.update(bookId, { currentLocation, lastReadTime: Date.now() })
    await this.updateSentenceChapters(bookId, exists)
  }

  async getCurrentLocation(bookId: string): Promise<ReadingProgress> {
    const readingProgress = await this.readingProgress.get(bookId)
    if (!readingProgress) throw new Error('Reading progress not found')
    await this.updateSentenceChapters(bookId, readingProgress)
    const updated = await this.readingProgress.get(bookId)
    if (!updated) throw new Error('Reading progress not found')
    return updated
  }

  async updateSentenceChapters(bookId: string, readingProgress: ReadingProgress): Promise<void> {
    const { chapterIndex } = readingProgress.currentLocation
    const sentenceChapters = readingProgress.sentenceChapters
    const lines = sentenceChapters[chapterIndex]
    if (lines) return

    const book = await this.getBook(bookId)
    if (!book) throw new Error('Book not found')

    const computed = paragraphs2Lines(book, chapterIndex)
    await this.readingProgress.update(bookId, {
      sentenceChapters: { ...sentenceChapters, [chapterIndex]: computed },
    })
  }
}

function getBookPreview(books: Book[]): BookPreview[] {
  return books.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    cover: book.metadata.cover,
    uploadTime: book.uploadTime ?? book.createTime,
    createTime: book.createTime,
  }))
}

function paragraphs2Lines(book: Book, chapterIndex: number): string[] {
  const { paragraphs } = book.chapterList[chapterIndex]

  const allSentences: string[] = []
  paragraphs.forEach((paragraph) => {
    const isChinese = /[\u4e00-\u9fa5]/.test(paragraph)
    let sentences: string[] = []
    if (isChinese) sentences = paragraph.match(/[^。！？]+[。！？]/g) || []
    else {
      const doc = nlp(paragraph)
      sentences = doc.sentences().out('array')
    }
    allSentences.push(...sentences, 'EOB')
  })

  return allSentences.reduce((acc, sentence) => {
    if (sentence === 'EOB') {
      acc.push('')
      return acc
    }
    acc.push(sentence)
    return acc
  }, [] as string[])
}

const dbIndexed = new BookDB()

export default dbIndexed
