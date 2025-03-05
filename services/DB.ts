import Dexie, { Table } from 'dexie'
import { Book } from '@/types/book'

class BookDB extends Dexie {
  books!: Table<Book>

  constructor() {
    super('book-reader')
    this.version(1).stores({
      books: 'id, title, author, format, createTime, lastReadTime, fileHash, fileSize, *metadata.isbn'
    })
  }


}

const db = new BookDB()

export default db
