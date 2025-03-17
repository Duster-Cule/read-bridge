'use client'

import db from "@/services/DB";
import { useSiderStore } from "@/store/useSiderStore";
import { ReadingProgress } from "@/types/book";
import { useEffect, useState } from "react";

export function useReadingProgress() {

  const { readingId } = useSiderStore()

  const [readingProgress, setReadingProgress] = useState<ReadingProgress['currentLocation']>({
    chapterIndex: 0,
    lineIndex: 0
  })

  useEffect(() => {
    if (!readingId) return
    db.getCurrentLocation(readingId).then(
      (currentLocation) => {
        setReadingProgress(currentLocation)
        console.log(currentLocation, 'progress')
      }
    )
  }, [readingId])

  return [readingProgress, setReadingProgress] as const
}

