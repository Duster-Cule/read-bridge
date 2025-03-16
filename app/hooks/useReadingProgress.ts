'use client'

import db from "@/services/DB";
import { useSiderStore } from "@/store/useSiderStore";
import { ReadingProgress } from "@/types/book";
import { useEffect, useMemo, useState } from "react";

export function useReadingProgress() {

  const { readingId } = useSiderStore()
  const defaultReadingProgress = useMemo(() => ({
    bookId: '',
    lastReadTime: 0,
    currentLocation: {
      chapterIndex: 0,
      lineIndex: 0
    }
  }), [])
  const [readingProgress, setReadingProgress] = useState<ReadingProgress>(defaultReadingProgress)

  useEffect(() => {
    if (readingId) {
      db.getReadingProgress(readingId).then(setReadingProgress)
    } else {
      setReadingProgress(defaultReadingProgress)
    }
  }, [readingId, defaultReadingProgress])

  return [readingProgress, setReadingProgress] as const
}

