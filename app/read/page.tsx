'use client'
import { useBook } from "@/app/hooks/useBook"

export default function ReadPage({ searchParams }: { searchParams: { id: string } }) {
  const id = searchParams.id ?? ''
  const book = useBook(id)

  return (
    <div className="w-full h-full p-2">
      正在阅读书籍 ID: {id}, 正在阅读书籍 title: {book?.title}
    </div>
  )
} 