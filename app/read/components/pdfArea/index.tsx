'use client'

import type { Book, ReadingProgress } from '@/types/book'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import db from '@/services/DB'

import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from 'antd'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import './pdfArea.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

function bytesToObjectUrl(bytes: Uint8Array, mediaType: string): string {
  const buffer = bytes.buffer as ArrayBuffer
  const blob = new Blob([buffer.slice(0)], { type: mediaType })
  return URL.createObjectURL(blob)
}

type PendingLocation = { chapterIndex: number; lineIndex: number }

export default function PDFArea({ book, readingProgress }: { book: Book; readingProgress: ReadingProgress }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [pageWidth, setPageWidth] = useState<number>(800)
  const [zoom, setZoom] = useState<number>(1)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const saveStateRef = useRef<{
    timer: ReturnType<typeof setTimeout> | null
    inFlight: boolean
    pending: PendingLocation | null
    lastSavedAt: number
    lastSavedKey: string
  }>({
    timer: null,
    inFlight: false,
    pending: null,
    lastSavedAt: 0,
    lastSavedKey: '',
  })

  const ZOOM_MIN = 0.5
  const ZOOM_MAX = 2.5
  const ZOOM_STEP = 0.1

  const pdfSource = useMemo(() => {
    const metadata = book.metadata as unknown as Record<string, unknown>
    const source = metadata.sourceFile as { data?: unknown } | undefined
    const data = source?.data
    if (!data || typeof data !== 'string') return null

    // If data looks like a URL/path, pass it directly to react-pdf.
    if (data.startsWith('/') || data.startsWith('http://') || data.startsWith('https://')) {
      return { kind: 'url' as const, value: data }
    }

    // Otherwise treat it as base64 (legacy behavior).
    return { kind: 'objectUrl' as const, value: bytesToObjectUrl(base64ToUint8Array(data), 'application/pdf') }
  }, [book.metadata])

  const pdfUrl = useMemo(() => {
    if (!pdfSource) return null
    return pdfSource.kind === 'url' ? pdfSource.value : pdfSource.value
  }, [pdfSource])

  useEffect(() => {
    return () => {
      if (pdfSource?.kind === 'objectUrl' && pdfSource.value) URL.revokeObjectURL(pdfSource.value)
    }
  }, [pdfSource])

  const savedPageIndex = useMemo(() => {
    // Reuse lineIndex as page index (0-based) in PDF mode.
    const idx = readingProgress.currentLocation?.lineIndex ?? 0
    return Number.isFinite(idx) && idx >= 0 ? idx : 0
  }, [readingProgress.currentLocation?.lineIndex])

  const setPageRef = useCallback((el: HTMLDivElement | null, pageIndex: number) => {
    if (el) pageRefs.current.set(pageIndex, el)
    else pageRefs.current.delete(pageIndex)
  }, [])

  const updateWidth = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const width = Math.max(320, Math.floor(container.clientWidth) - 16)
    setPageWidth(width)
  }, [])

  const scheduleSaveLocation = useCallback((lineIndex: number) => {
    const chapterIndex = 0
    const key = `${chapterIndex}:${lineIndex}`
    if (saveStateRef.current.lastSavedKey === key && !saveStateRef.current.pending) {
      return
    }

    saveStateRef.current.pending = { chapterIndex, lineIndex }
    if (saveStateRef.current.inFlight) return

    const now = Date.now()
    const elapsed = now - saveStateRef.current.lastSavedAt
    const delay = Math.max(0, 800 - elapsed)

    if (saveStateRef.current.timer) clearTimeout(saveStateRef.current.timer)
    saveStateRef.current.timer = setTimeout(async () => {
      const pending = saveStateRef.current.pending
      if (!pending) return
      saveStateRef.current.pending = null
      saveStateRef.current.inFlight = true
      try {
        await db.updateCurrentLocation(book.id, pending)
        saveStateRef.current.lastSavedAt = Date.now()
        saveStateRef.current.lastSavedKey = `${pending.chapterIndex}:${pending.lineIndex}`
      } finally {
        saveStateRef.current.inFlight = false
        const queued = saveStateRef.current.pending as unknown as PendingLocation | null
        if (queued !== null) scheduleSaveLocation(queued.lineIndex)
      }
    }, delay)
  }, [book.id])

  const renderWidth = useMemo(() => {
    return Math.max(200, Math.floor(pageWidth * zoom))
  }, [pageWidth, zoom])

  const shouldCenterPages = useMemo(() => {
    // When the rendered page is wider than the viewport, centering via flex can create
    // negative free space and make the content appear offset/unreachable.
    return renderWidth <= pageWidth
  }, [renderWidth, pageWidth])

  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(ZOOM_MAX, Math.round((prev + ZOOM_STEP) * 10) / 10))
  }, [])

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(ZOOM_MIN, Math.round((prev - ZOOM_STEP) * 10) / 10))
  }, [])

  const zoomReset = useCallback(() => {
    setZoom(1)
  }, [])

  useEffect(() => {
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [updateWidth])

  // Scroll to saved page on load / chapter change
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const el = pageRefs.current.get(savedPageIndex)
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } else {
      container.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [savedPageIndex, numPages])

  // Persist current visible page as reading position
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)

      scrollTimeoutRef.current = setTimeout(() => {
        const containerRect = container.getBoundingClientRect()
        const containerTop = containerRect.top + 10

        let visiblePageIndex = 0
        for (let i = 0; i < numPages; i++) {
          const pageEl = pageRefs.current.get(i)
          if (!pageEl) continue
          const rect = pageEl.getBoundingClientRect()
          if (rect.bottom >= containerTop && rect.top <= (containerRect.top + containerRect.height)) {
            visiblePageIndex = i
            break
          }
        }

        scheduleSaveLocation(visiblePageIndex)
      }, 300)
    }

    container.addEventListener('scroll', handleScroll)
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [book.id, numPages])
  useEffect(() => {
    return () => {
      if (saveStateRef.current.timer) clearTimeout(saveStateRef.current.timer)
    }
  }, [])

  if (!pdfUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-sm text-[var(--ant-color-text-tertiary)]">PDF 数据缺失</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-w-0 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 py-1">
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-[var(--ant-color-border)] bg-[var(--ant-color-bg-container)]">
          <Button size="small" onClick={zoomOut} disabled={zoom <= ZOOM_MIN}>-</Button>
          <Button size="small" onClick={zoomReset} disabled={zoom === 1}>
            {Math.round(zoom * 100)}%
          </Button>
          <Button size="small" onClick={zoomIn} disabled={zoom >= ZOOM_MAX}>+</Button>
        </div>
      </div>

      <div
        ref={containerRef}
        data-reader-mode="pdf"
        className="w-full h-full min-w-0 overflow-x-auto overflow-y-auto p-2 pt-12"
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={(info) => setNumPages(info.numPages)}
          loading={<div className="text-sm text-[var(--ant-color-text-tertiary)]">加载 PDF...</div>}
          error={<div className="text-sm text-[var(--ant-color-text-tertiary)]">加载 PDF 失败</div>}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div
              key={i}
              ref={(el) => setPageRef(el, i)}
              className="mb-3"
            >
              <div
                className={`bg-[var(--ant-color-bg-container)] rounded-lg overflow-hidden ${shouldCenterPages ? 'mx-auto' : ''}`}
                style={{ width: renderWidth }}
              >
                <Page
                  pageNumber={i + 1}
                  width={renderWidth}
                  renderAnnotationLayer
                  renderTextLayer
                />
              </div>
            </div>
          ))}
        </Document>
      </div>
    </div>
  )
}
