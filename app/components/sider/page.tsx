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
  const currentLocation = useMemo(() => {
    return readingProgress.currentLocation || null
  }, [readingProgress])

  const pathname = usePathname()

  // 当返回阅读页面时 更新阅读进度
  useEffect(() => {
    if (pathname.includes('/read') && readingId) {
      updateReadingProgress(readingId)
    }
  }, [updateReadingProgress, pathname, readingId])
  const updateLineIndex = useCallback(async (lineIndex: number) => {
    // 发送完成后更新line
    if (!readingId) return
    await db.updateCurrentLocation(readingId, {
      chapterIndex: currentLocation.chapterIndex,
      lineIndex
    })
    const readingProgress = await updateReadingProgress(readingId)
    EventEmitter.emit(EVENT_NAMES.SEND_MESSAGE, readingProgress)
  }, [readingId, currentLocation, updateReadingProgress])


  useEffect(() => {
    const unsub = EventEmitter.on(EVENT_NAMES.SEND_LINE_INDEX, updateLineIndex)
    return () => {
      unsub()
    }
  }, [updateLineIndex])


  return (
    <div className="w-full h-full flex flex-col">
      <SiderContent />
      <SiderChat />
    </div>
  )
}
