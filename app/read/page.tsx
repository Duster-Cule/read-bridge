'use client'
import { useBook } from "@/app/hooks/useBook"
import { useSiderStore } from "@/store/useSiderStore"
import { useEffect } from "react"
import ReadMenu from "./components/menu"
import db from "@/services/DB"
import { useReadingProgress } from "@/app/hooks/useReadingProgress"

export default function ReadPage({ searchParams }: { searchParams: { id: string } }) {
  const id = searchParams.id ?? ''
  const { readingId, setReadingId } = useSiderStore()
  useEffect(() => {
    if (id) setReadingId(id)
  }, [id, readingId, setReadingId])
  const [book] = useBook()
  const [readingProgress, setReadingProgress] = useReadingProgress()
  if (!book) return <div>书籍不存在</div>


  const handleChapterChange = (index: number) => {
    db.updateCurrentLocation(id, { chapterIndex: index, lineIndex: 0 })
    setReadingProgress({
      ...readingProgress,
      bookId: id,
      lastReadTime: Date.now(),
      currentLocation: {
        chapterIndex: index,
        lineIndex: 0
      }
    })
  }
  return (
    <div className="w-full h-full p-2 flex flex-row">
      <ReadMenu toc={book.toc} currentChapter={readingProgress.currentLocation.chapterIndex} onChapterChange={(index: number) => {
        handleChapterChange(index)
      }} />
      <div className="w-full overflow-auto">
        正在阅读书籍 ID: {id}, 正在阅读书籍 title: {book.title}
        {
          book.chapterList[readingProgress.currentLocation.chapterIndex].lines.map((line, index) => {
            return (
              <div key={index}>
                {line}
              </div>
            )
          })
        }
      </div>
    </div>
  )
} 