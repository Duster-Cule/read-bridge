'use client'

import db from "@/services/DB";
import { useSiderStore } from "@/store/useSiderStore";
import { ReadingProgress } from "@/types/book";
import { useCallback, useEffect, useState } from "react";

export function useReadingProgress() {

  const { readingId } = useSiderStore()

  const [readingProgress, setReadingProgress] = useState<ReadingProgress>({
    bookId: '',
    lastReadTime: 0,
    currentLocation: {
      chapterIndex: 0,
      lineIndex: 0
    },
    sentenceChapters: {}
  })

  useEffect(() => {
    if (!readingId) return
    updateReadingProgress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readingId])

  const updateReadingProgress = useCallback(() => {
    if (!readingId) return
    db.getCurrentLocation(readingId).then(
      (res) => {
        setReadingProgress(res)
      }
    ).catch(
      (err) => {
        console.error(err)
      }
    )
  }, [readingId])
  return [readingProgress, updateReadingProgress] as const
}

