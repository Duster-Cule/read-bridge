// web only

import Dexie, { Table } from 'dexie'
import { Book } from '@/types/book'

const DB_SEARCH_KEYS = ['&id', 'title', 'fileHash', 'author', 'createTime', 'lastReadTime', 'metadata.identifier', 'metadata.language']
class BookDB extends Dexie {
  books!: Table<Book>

  constructor() {
    super('book-reader')
    this.version(1).stores({
      books: DB_SEARCH_KEYS.join(',')
    })
  }
  /**
   * 添加新书
   * @throws {Error} 当书已存在时抛出异常
   * @returns 返回新增书籍的id 
   */
  async addBook(book: Book): Promise<string> {
    const exists = await this.books
      .where('fileHash')
      .equals(book.fileHash)
      .first()

    if (exists) {
      throw new Error('Book already exists')
    }

    return await this.books.add(book)
  }

  /**
   * 获取所有书籍
   * @returns 所有书籍
   */
  async getAllBooks(reverse = true): Promise<Book[]> {
    const books = await this.books.toArray()
    return books.sort((a, b) => bookSort(a, b, reverse))
  }


  /**
   * 按字段查询书籍
   * @param type Book 对象的键名
   * @param value 查询值
   * @param reverse 是否倒序
   * @returns 按最后阅读时间(当没阅读过则使用创建时间)返回
   */
  async getBooks(type: typeof DB_SEARCH_KEYS[number], value: string, reverse = true): Promise<Book[]> {
    const books = await this.books
      .where(type)
      .equals(value)
      .toArray()

    return books.sort((a, b) => bookSort(a, b, reverse))
  }

  /**
   * 更新书籍信息
   * @param id Book id
   * @param book 更新的书籍信息
   * @throws {Error} 当书籍不存在时抛出异常
   * @returns {Promise<void>}
   */
  async updateBook(id: string, book: Book): Promise<void> {
    if (book.id !== id) {
      throw new Error('Book id mismatch')
    }

    const exists = await this.books.get(id)
    if (!exists) {
      throw new Error('Book not found')
    }

    await this.books.put(book)
  }

  /**
   * 删除书籍
   * @param id Book id
   * @throws {Error} 当书籍不存在时抛出异常
   * @returns {Promise<void>}
   */
  async deleteBook(id: string): Promise<void> {
    const exists = await this.books.get(id)
    if (!exists) {
      throw new Error('Book not found')
    }

    await this.books.delete(id)
  }

  /**
   * 更新书籍的单个字段
   * @param id Book id
   * @param type 要更新的字段
   * @param value 新的值
   * @throws {Error} 当书籍不存在时抛出异常
   * @returns {Promise<void>}
   */
  async updateBookField<K extends keyof Book>(
    id: string,
    type: K,
    value: Book[K]
  ): Promise<void> {
    const exists = await this.books.get(id)
    if (!exists) {
      throw new Error('Book not found')
    }

    await this.books.update(id, { [type]: value } as Partial<Book>)
  }
}

function bookSort(a: Book, b: Book, reverse = true) {
  const timeA = a.lastReadTime ?? a.createTime ?? 0
  const timeB = b.lastReadTime ?? b.createTime ?? 0
  return reverse ? timeB - timeA : timeA - timeB
}

const db = new BookDB()

export default db
