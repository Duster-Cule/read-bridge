'use client'
import { useBook } from "@/app/hooks/useBook"
import { useSiderStore } from "@/store/useSiderStore"
import { LoadingOutlined, FileUnknownOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react"
import ReadMenu from "./components/menu"
import db from "@/services/DB"
import { useReadingProgress } from "@/app/hooks/useReadingProgress"
import { Spin, Result } from "antd"
import ReadArea from "./components/readArea"

export default function ReadPage({ searchParams }: { searchParams: { id: string } }) {
  const id = searchParams.id ?? ''
  const { setReadingId } = useSiderStore()
  const [loading, setLoading] = useState(true)
  const [bookNotFound, setBookNotFound] = useState(false)

  useEffect(() => {
    if (id) setReadingId(id)
  }, [id, setReadingId])

  const [book] = useBook()
  const [currentLocation, setCurrentLocation] = useReadingProgress()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!book) {
        setBookNotFound(true)
        setReadingId('')
      }
      setLoading(false)
    }, 5000)

    if (book) {
      setLoading(false)
      clearTimeout(timer)
    }

    return () => clearTimeout(timer)
  }, [book, setReadingId])

  if (loading) return (
    <div className="w-full h-full flex items-center justify-center">
      <Spin size="large" indicator={<LoadingOutlined spin />} tip="加载中...">
        <div className="w-[100px] h-[100px]"></div>
      </Spin>
    </div>
  )
  if (bookNotFound || !book) return <Result icon={<FileUnknownOutlined />} title="404" subTitle="抱歉，没有找到该书籍或已删除" />

  const handleChapterChange = (index: number) => {
    db.updateCurrentLocation(id, { chapterIndex: index, lineIndex: 0 })
    setCurrentLocation((prev) => ({
      ...prev,
      lineIndex: 0,
      chapterIndex: index
    }))
  }

  return (
    <div className="w-full h-full p-2 flex flex-row">
      <ReadMenu toc={book.toc} currentChapter={currentLocation.chapterIndex} onChapterChange={(index: number) => {
        handleChapterChange(index)
      }} />
      <ReadArea book={book} currentChapter={currentLocation.chapterIndex} />
    </div>
  )
} 