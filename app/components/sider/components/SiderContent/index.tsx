import { useEffect, useMemo, useState } from "react"
import { EventEmitter, EVENT_NAMES } from "@/services/EventService"
import nlp from 'compromise'
import StandardChat from "../StandardChat"
import { useReadingProgress } from "@/app/hooks/useReadingProgress"

export default function SiderContent() {
  const [line, setLine] = useState<string>("")
  const [readingProgress, updateReadingProgress] = useReadingProgress()

  const lines = useMemo(() => {
    if (!window.location.pathname.includes('/read')) return []
    if (!readingProgress.currentLocation?.chapterIndex) return []
    return readingProgress.sentenceChapters[readingProgress.currentLocation?.chapterIndex ?? 0]?.filter(line => line !== '') || []
  }, [readingProgress.currentLocation?.chapterIndex])

  const nplLine = useMemo(() => {
    if (line.length === 0) return []
    const doc = nlp(line)
    return doc.terms().json()
  }, [line])

  const getChunkColor = (chunk: string) => {
    switch (chunk) {
      case 'Noun':
        return '';
      case 'Verb':
        return 'text-[var(--ant-green-6)]';
      case 'Adjective':
        return 'text-[var(--ant-purple-6)]';
      case 'Pivot':
        return 'text-[var(--ant-gold-6)]';
      default:
        return '';
    }
  }

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
      <div className="space-y-2">
        {nplLine.map((term, i) => (
          <span
            key={i}
            className={`${getChunkColor(term.terms[0].chunk)} hover:underline cursor-help`}
            title={`Type: ${term.terms[0].chunk}\nTags: ${term.terms[0].tags.join(', ')}`}
          >
            {term.text}{' '}
          </span>
        ))}
      </div>
      <StandardChat />
    </div>
  )
}