'use client'

import { useReadingProgressStore } from "@/store/useReadingProgress"
import { usePathname } from "next/navigation"
import React, { useCallback, useEffect, useMemo } from "react"

import SiderContent from "@/app/components/sider/components/SiderContent"
import SiderChat from "@/app/components/sider/components/SiderChat"
import { useSiderStore } from "@/store/useSiderStore"

import { EventEmitter, EVENT_NAMES } from "@/services/EventService"
import db from "@/services/DB"

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
  const updateLineIndex = useCallback((lineIndex: number) => {
    // 发送完成后更新line
    if (!readingId) return
    setTimeout(async () => {
      await db.updateCurrentLocation(readingId, {
        chapterIndex: currentLocation.chapterIndex,
        lineIndex
      })
      await updateReadingProgress(readingId)
    }, 600)
  }, [readingId, currentLocation])


  useEffect(() => {
    const unsub = EventEmitter.on(EVENT_NAMES.SEND_LINE_INDEX, updateLineIndex)
    return () => {
      unsub()
    }
  }, [updateLineIndex])


  return (
    <div className="w-full h-full flex flex-col">
      <SiderContent currentChapter={currentChapter} />
      <SiderChat currentChapter={currentChapter} lineIndex={readingProgress.currentLocation.lineIndex} />
    </div>
  )
}
