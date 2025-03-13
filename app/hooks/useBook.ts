'use client'

import db from "@/services/DB";
import { useSiderStore } from "@/store/useSiderStore";
import { Book } from "@/types/book";
import { useEffect, useState } from "react";

export function useBook(id: string) {
  const { readingId, setReadingId } = useSiderStore()
  const [book, setBook] = useState<Book | null>(null)

  useEffect(() => {
    const targetId = id || readingId
    if (targetId) {
      setReadingId(targetId)
      db.getBook(targetId).then(setBook)
    } else {
      setReadingId(null)
      setBook(null)
    }
  }, [id, readingId, setReadingId])

  return book
}

