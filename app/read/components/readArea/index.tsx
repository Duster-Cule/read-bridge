import { Book, ReadingProgress } from "@/app/types/book"
import React, { useCallback, useEffect, useRef, useState } from "react"
import db from "@/app/services/DB"
import { EVENT_NAMES, EventEmitter } from "@/app/services/EventService"
import { Radio } from "antd"


export default function ReadArea({ book, currentLocation }: { book: Book, currentLocation: ReadingProgress }) {
  const title = book.chapterList[currentLocation.currentLocation.chapterIndex].title
  const lines = currentLocation.sentenceChapters[currentLocation.currentLocation.chapterIndex] ?? []
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedLine, setSelectedLine] = useState<number>(Infinity)


  useEffect(() => {
    // 滚动条跳转最上方
    containerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [lines])

  // 更新阅读数据
  useEffect(() => {
    db.updateCurrentLocation(book.id, { chapterIndex: currentLocation.currentLocation.chapterIndex, lineIndex: selectedLine })
  }, [selectedLine])

  const handleLineClick = useCallback((index: number) => {
    setSelectedLine(prevSelectedLine => {
      const newSelectedLine = prevSelectedLine === index ? Infinity : index;
      EventEmitter.emit(EVENT_NAMES.SEND_LINE_INDEX, newSelectedLine);
      return newSelectedLine;
    });
  }, []);

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

