'use client'

import { useReadingProgress } from "@/hooks/useReadingProgress"
import { usePathname } from "next/navigation"
import React, { useEffect, useMemo } from "react"

import SiderContent from "@/app/components/sider/components/SiderContent"
import SiderChat from "@/app/components/sider/components/SiderChat"

export default function Sider() {
  const [readingProgress, updateReadingProgress] = useReadingProgress()
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
    if (pathname.includes('/read')) {
      updateReadingProgress()
    }
  }, [updateReadingProgress, pathname])


  return (
    <div className="w-full h-full flex flex-col">
      <SiderContent currentChapter={currentChapter} />
      <SiderChat currentChapter={currentChapter} lineIndex={readingProgress.currentLocation.lineIndex} />
    </div>
  )
}
