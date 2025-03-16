'use client'

import db from "@/services/DB";
import { useSiderStore } from "@/store/useSiderStore";
import { Book } from "@/types/book";
import { useEffect, useState } from "react";

export function useBook() {
  const { readingId } = useSiderStore()
  const [book, setBook] = useState<Book | null>(null)

  useEffect(() => {
    if (readingId) {
      db.getBook(readingId).then(setBook)
    } else {
      setBook(null)
    }
  }, [readingId])

  return [book, setBook] as const
}

