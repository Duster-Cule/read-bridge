import { Book, ReadingProgress } from "@/src/types/book"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import db from "@/src/services/DB"
import { EVENT_NAMES, EventEmitter } from "@/src/services/EventService"
import { Radio } from "antd"


export default function ReadArea({ book, readingProgress }: { book: Book, readingProgress: ReadingProgress }) {
  const title = useMemo(() => {
    return book.chapterList[readingProgress.currentLocation.chapterIndex].title
  }, [book, readingProgress.currentLocation.chapterIndex])
  const lines = useMemo(() => {
    return readingProgress.sentenceChapters[readingProgress.currentLocation.chapterIndex] ?? []
  }, [readingProgress.sentenceChapters, readingProgress.currentLocation.chapterIndex])
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedLine, setSelectedLine] = useState<number>(Infinity)


  useEffect(() => {
    // 滚动条跳转最上方
    containerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [lines])


  const handleLineClick = useCallback((index: number) => {
    setSelectedLine(prevSelectedLine => {
      const newSelectedLine = prevSelectedLine === index ? Infinity : index;
      EventEmitter.emit(EVENT_NAMES.SEND_LINE_INDEX, newSelectedLine);
      db.updateCurrentLocation(book.id, { chapterIndex: readingProgress.currentLocation.chapterIndex, lineIndex: newSelectedLine })
      return newSelectedLine;
    });
  }, [book.id, readingProgress.currentLocation.chapterIndex]);

  return (
    <div
      ref={containerRef}
      className='w-full h-full overflow-auto p-2'
    >
      <div className="text-2xl font-bold mb-4 ml-8">{title}</div>
      <div className="text-lg">
        {lines.length > 0 && lines.map((sentence, index) => {
          return (
            <Line
              sentence={sentence}
              index={index}
              isSelected={selectedLine === index}
              key={index}
              handleLineClick={handleLineClick}
            />
          )
        })}
      </div>
    </div>
  )
}


const Line = React.memo(({ sentence, index, isSelected, handleLineClick }: {
  sentence: string,
  index: number,
  isSelected: boolean,
  handleLineClick: (index: number) => void
}) => {
  if (!sentence) {
    return <div className="h-4" />
  }

  return (
    <div className={`flex mb-1 group rounded-lg ${isSelected ? 'bg-[var(--ant-color-bg-text-hover)]' : ''} hover:bg-[var(--ant-color-bg-text-hover)]`}>
      <div className={`w-6 flex justify-end items-center`}
        onClick={() => handleLineClick(index)}
      >
        <Radio
          checked={isSelected}
          className={isSelected ? "" : "hidden group-hover:block"}
        />
      </div>
      <div className={`mx-1`} />
      <div className="flex-1">{sentence}</div>
    </div>
  )
})
Line.displayName = 'Line'
