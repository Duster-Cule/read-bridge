import { Book, ReadingProgress } from "@/types/book"
import React, { useEffect, useRef, useState } from "react"
import db from "@/services/DB"
import { EVENT_NAMES, EventEmitter } from "@/services/EventService"


export default function ReadArea({ book, currentLocation }: { book: Book, currentLocation: ReadingProgress }) {
  const title = book.chapterList[currentLocation.currentLocation.chapterIndex].title
  const lines = currentLocation.sentenceChapters[currentLocation.currentLocation.chapterIndex] ?? []
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedLine, setSelectedLine] = useState<number>(Infinity)
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0)

  useEffect(() => {
    // 滚动条跳转最上方
    containerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [lines])
  let lineNumber = 1

  // 更新阅读数据
  useEffect(() => {
    db.updateCurrentLocation(book.id, { chapterIndex: currentLocation.currentLocation.chapterIndex, lineIndex: currentLineIndex })
  }, [currentLineIndex])

  const handleLineClick = (index: number, sentence: string) => {
    setCurrentLineIndex(index)
    setSelectedLine(index)
    EventEmitter.emit(EVENT_NAMES.SEND_MESSAGE, sentence)
  }

  return (
    <div
      ref={containerRef}
      className='w-full h-full overflow-auto p-2'
    >
      <div className="text-2xl font-bold mb-4 ml-10">{title}</div>
      <div className="text-lg">
        {lines.length > 0 && lines.map((sentence, index) => {
          return (
            <Line
              sentence={sentence}
              index={index}
              lineNumber={sentence ? lineNumber++ : undefined}
              selectedLine={selectedLine}
              key={index}
              handleLineClick={handleLineClick}
            />
          )
        })}
      </div>
    </div>
  )
}


const Line = React.memo(({ sentence, index, lineNumber, selectedLine, handleLineClick }: {
  sentence: string,
  index: number,
  lineNumber?: number,
  selectedLine: number,
  handleLineClick: (index: number, sentence: string) => void
}) => {
  if (!sentence) {
    return <div className="h-4" />
  }

  const isSelected = selectedLine === index

  return (
    <div className={`flex mb-1 group rounded-lg ${isSelected ? 'bg-[var(--ant-color-bg-text-hover)]' : ''}`}>
      <div className={`w-10 text-right pr-1 select-none cursor-pointer text-[var(--ant-color-primary)] hover:text-[var(--ant-color-primary-hover)]`}
        onClick={() => handleLineClick(index, sentence)}
      >
        {lineNumber}
      </div>
      <div className={`mx-1 select-none text-[var(--ant-color-border)]`}>|</div>
      <div className="flex-1">{sentence}</div>
    </div>
  )
})

