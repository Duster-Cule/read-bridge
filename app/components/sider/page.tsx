'use client'

import { useReadingProgressStore } from "@/store/useReadingProgress"
import { usePathname } from "next/navigation"
import React, { useEffect, useMemo } from "react"

import SiderContent from "@/app/components/sider/components/SiderContent"
import SiderChat from "@/app/components/sider/components/SiderChat"
import { useSiderStore } from "@/store/useSiderStore"

export default function Sider() {
  const { readingId } = useSiderStore()
  const { readingProgress, updateReadingProgress } = useReadingProgressStore()
  const sentenceChapters = useMemo(() => {
    return readingProgress.sentenceChapters || null
  }, [readingProgress])
  const currentLocation = useMemo(() => {
    return readingProgress.currentLocation || null
  }, [readingProgress])
  // 当前章节
  const currentChapter = useMemo(() => {
    if (!sentenceChapters || !currentLocation) return []
    return sentenceChapters[currentLocation.chapterIndex] || []
  }, [sentenceChapters, currentLocation])
  const pathname = usePathname()

  // 当返回阅读页面时 更新阅读进度
  useEffect(() => {
    if (pathname.includes('/read') && readingId) {
      updateReadingProgress(readingId)
    }
  }, [updateReadingProgress, pathname, readingId])


  return (
    <div className="w-full h-full flex flex-col">
      <SiderContent currentChapter={currentChapter} />
      <SiderChat currentChapter={currentChapter} lineIndex={readingProgress.currentLocation.lineIndex} />
    </div>
  )
}
