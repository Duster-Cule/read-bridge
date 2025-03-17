'use client'

import db from "@/services/DB";
import { useSiderStore } from "@/store/useSiderStore";
import { ReadingProgress } from "@/types/book";
import { useEffect, useMemo, useState } from "react";

export function useReadingProgress() {

  const { readingId } = useSiderStore()
  const defaultCurrentLocation = useMemo(() => ({
    chapterIndex: 0,
    lineIndex: 0
  }), [])
  const [readingProgress, setReadingProgress] = useState<ReadingProgress['currentLocation']>(defaultCurrentLocation)

  useEffect(() => {
    if (readingId) {
      db.getReadingProgress(readingId).then(
        (progress) => {
          setReadingProgress(progress.currentLocation)
        }
      )
    } else {
      setReadingProgress(defaultCurrentLocation)
    }
  }, [readingId, defaultCurrentLocation])

  return [readingProgress, setReadingProgress] as const
}

