import { Book } from "@/types/book"
import { useEffect, useRef, useState } from "react"

export default function ReadArea({ book, currentChapter, lineChange }: { book: Book, currentChapter: number, lineChange: (index: number) => void }) {
  const title = book.chapterList[currentChapter].title
  const paragraphs = book.chapterList[currentChapter].paragraphs
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])
  const [sentences, setSentences] = useState<string[]>([])

  useEffect(() => {
    const allSentences: string[] = []
    paragraphs.forEach(paragraph => {
      const sentencesInParagraph = paragraph.split(/(?<=([。！？.!?]|'\s*(?=\n|[A-Z])))(?<!\.{3})\s*/)
      allSentences.push(...sentencesInParagraph.filter(s => {
        const trimmed = s.trim()
        return trimmed !== '' && trimmed !== '.'
      }))
    })
    setSentences(allSentences)
    lineRefs.current = allSentences.map(() => null)
  }, [paragraphs])

  // 监听滚动事件，更新当前行
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { top: containerTop } = container.getBoundingClientRect()
      let currentLineIndex = 0
      let minDistance = Infinity

      lineRefs.current.forEach((lineRef, index) => {
        if (!lineRef) return
        const { top } = lineRef.getBoundingClientRect()
        const distance = Math.abs(top - containerTop)

        if (distance < minDistance) {
          minDistance = distance
          currentLineIndex = index
        }
      })

      lineChange(currentLineIndex)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [lineChange, sentences.length])

  const handleLineClick = (index: number) => {
    console.log(`Clicked line ${index + 1}`)
    console.log(currentChapter)
  }

  return (
    <div ref={containerRef} className="w-full h-full overflow-auto p-2">
      <div className="text-2xl font-bold mb-4">{title}</div>
      <div className="text-lg">
        {sentences.map((sentence, index) => (
          <div
            key={index}
            className={`flex mb-1 hover:bg-gray-100 dark:hover:bg-gray-800 group ${index === currentChapter ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
            ref={el => {
              lineRefs.current[index] = el
            }}
          >
            <div
              className="w-10 text-right pr-1 text-blue-500 select-none cursor-pointer group-hover:text-blue-600 dark:text-blue-400 dark:group-hover:text-blue-300"
              onClick={() => handleLineClick(index)}
            >
              {index + 1}
            </div>
            <div className="text-gray-300 mx-1 select-none">|</div>
            <div className="flex-1">{sentence}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
