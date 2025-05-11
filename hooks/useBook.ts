'use client'

import db from "@/services/DB";
import { useSiderStore } from "@/store/useSiderStore";
import { Book } from "@/types/book";
import { useEffect, useState } from "react";

export function useBook() {
  const { readingId } = useSiderStore()
  const [book, setBook] = useState<Book | null>(null)

  useEffect(() => {
    updateBook()
  }, [readingId])
  async function updateBook(): Promise<void> {
    if (!readingId) {
      setBook(null)
      return
    }
    try {
      const res = await db.getBook(readingId)
      setBook(res)
    } catch (error) {
      console.error('Error updating book:', error)
    }
  }
  return [book, setBook, updateBook] as const
}

