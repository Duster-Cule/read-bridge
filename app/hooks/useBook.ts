'use client'

import db from "@/app/services/DB";
import { useSiderStore } from "@/app/store/useSiderStore";
import { Book } from "@/app/types/book";
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

