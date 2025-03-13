'use client'
import { useBook } from "@/app/hooks/useBook"
import { useSiderStore } from "@/store/useSiderStore"
import { useEffect } from "react"
export default function ReadPage({ searchParams }: { searchParams: { id: string } }) {
  const id = searchParams.id ?? ''
  const { setReadingId } = useSiderStore()
  useEffect(() => {
    if (id) setReadingId(id)
  }, [id, setReadingId])
  const book = useBook()

  if (!book) return <div>书籍不存在</div>
  return (
    <div className="w-full h-full p-2">
      正在阅读书籍 ID: {id}, 正在阅读书籍 title: {book.title}
      {book.chapterList.map((chapter) => (
        <div key={chapter.title}>
          {chapter.lines.map(line => {
            return (
              <div key={line}>
                {line}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
} 