'use client'

import { useReadingProgress } from "@/hooks/useReadingProgress"
import { usePathname } from "next/navigation"
import React, { useEffect, useMemo } from "react"

import SiderContent from "@/app/components/sider/components/SiderContent"
import SiderChat from "@/app/components/sider/components/SiderChat"

export default function Sider() {
  const [readingProgress, updateReadingProgress] = useReadingProgress()
  // 当前章节
  const currentChapter = useMemo(() => {
    return readingProgress.sentenceChapters[readingProgress.currentLocation.chapterIndex]
  }, [readingProgress.sentenceChapters, readingProgress.currentLocation.chapterIndex])
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
      <SiderChat />
    </div>
  )
}
