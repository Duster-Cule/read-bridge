import { useEffect, useMemo, useState } from "react"
import { EventEmitter, EVENT_NAMES } from "@/services/EventService"
import nlp from 'compromise'
import { useReadingProgress } from "@/hooks/useReadingProgress"
import { createLLMClient } from "@/services/llm"
import { useLLMStore } from "@/store/useLLMStore"

export default function SiderContent() {
  const [line, setLine] = useState<string>("")
  const [readingProgress] = useReadingProgress()
  const { defaultModel } = useLLMStore()
  const [translation, setTranslation] = useState<string>("")
  const [translation2, setTranslation2] = useState<string>("")
  const translatorClient = useMemo(() => {

    return defaultModel
      ? createLLMClient(defaultModel)
      : null
  }, [defaultModel])
  const currentChapterLines = useMemo(() => {
    const lines = readingProgress.sentenceChapters[readingProgress.currentLocation.chapterIndex] || []
    return lines

  }, [readingProgress.sentenceChapters, readingProgress.currentLocation.chapterIndex]);

  useEffect(() => {
    const unsub = EventEmitter.on(EVENT_NAMES.SEND_LINE_INDEX, async (index: number) => {
      const text = currentChapterLines[index] || ""
      setLine(text)
      if (translatorClient) {
        setTranslation('')
        setTranslation2('')
        translatorClient.completions([{ role: 'user', content: text }], 'you are a professional translator, please translate the content I give you into Chinese').then(result => {
          setTranslation(result)
        })

        const generator = translatorClient.completionsGenerator([{ role: 'user', content: text }], 'you are a professional translator, please translate the content I give you into Chinese');
        for await (const chunk of generator) {
          setTranslation2(prev => prev + chunk);
        }
      }
    })
    return () => {
      unsub()
    }
  }, [currentChapterLines, translatorClient])

  const nplLine = useMemo(() => {
    if (line && line.length > 0) {
      const doc = nlp(line)
      return doc.terms().json()
    }
    return []
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

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <div className="space-y-2">
        {nplLine.map((term, i) => (
          <span
            key={i}
            className={`${getChunkColor(term.terms[0].chunk)} hover:underline cursor-pointer`}
          >
            {term.text}{' '}
          </span>
        ))}
      </div>
      <div className="flex-1">
        {translation}
        {translation2}
      </div>
    </div>
  )
}