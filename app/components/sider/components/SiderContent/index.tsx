import { useEffect, useMemo, useState } from "react"
import { EventEmitter, EVENT_NAMES } from "@/services/EventService"

import StandardChat from "../StandardChat"
import { useReadingProgress } from "@/app/hooks/useReadingProgress"

export default function SiderContent() {
  const [line, setLine] = useState<string>('')
  const [readingProgress, updateReadingProgress] = useReadingProgress()

  const lines = useMemo(() => {
    return readingProgress.sentenceChapters[readingProgress.currentLocation.chapterIndex].filter(line => line !== '')
  }, [readingProgress.currentLocation.chapterIndex])

  useEffect(() => {
    const unsub = EventEmitter.on(EVENT_NAMES.SEND_MESSAGE, (sentence: string) => {
      setLine(sentence)
    })
    return () => {
      unsub()
    }
  }, [])
  return (
    <div className="w-full h-full p-4 flex flex-col">

      <StandardChat />
    </div>
  )
}