import { Book, ReadingProgress } from "@/types/book"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import db from "@/services/DB"
import { EVENT_NAMES, EventEmitter } from "@/services/EventService"
import { Radio } from "antd"
import { useStyleStore, FontSize } from "@/store/useStyleStore"
import PDFArea from "../pdfArea"


export default function ReadArea({ book, readingProgress }: { book: Book, readingProgress: ReadingProgress }) {
  const isPDF = useMemo(() => {
    const source = (book.metadata as any)?.sourceFile
    return source?.mediaType === 'application/pdf'
  }, [book.metadata])

  if (isPDF) {
    return <PDFArea book={book} readingProgress={readingProgress} />
  }

  const { fontSize } = useStyleStore()

  const title = useMemo(() => {
    return book.chapterList[readingProgress.currentLocation.chapterIndex]?.title || ''
  }, [book, readingProgress.currentLocation.chapterIndex])

  const lines = useMemo(() => {
    return readingProgress.sentenceChapters[readingProgress.currentLocation.chapterIndex] ?? []
  }, [readingProgress.sentenceChapters, readingProgress.currentLocation.chapterIndex])

  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-xl'
  }

  const titleFontSizeClasses = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl'
  }

  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedLine, setSelectedLine] = useState<number>(Infinity)
  const lineRefsMap = useRef<Map<number, HTMLDivElement>>(new Map())
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const saveStateRef = useRef<{
    timer: ReturnType<typeof setTimeout> | null
    inFlight: boolean
    pending: { chapterIndex: number; lineIndex: number } | null
    lastSavedAt: number
    lastSavedKey: string
  }>({
    timer: null,
    inFlight: false,
    pending: null,
    lastSavedAt: 0,
    lastSavedKey: '',
  })

  const scheduleSaveLocation = useCallback((chapterIndex: number, lineIndex: number) => {
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
        if (saveStateRef.current.pending) {
          scheduleSaveLocation(saveStateRef.current.pending.chapterIndex, saveStateRef.current.pending.lineIndex)
        }
      }
    }, delay)
  }, [book.id])

  // 页面加载时滚动到上次阅读位置
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const savedLineIndex = readingProgress.currentLocation.lineIndex;
    if (savedLineIndex !== undefined && savedLineIndex !== Infinity && savedLineIndex > 0) {
      // 等待DOM
      setTimeout(() => {
        const lineElement = lineRefsMap.current.get(savedLineIndex);
        if (lineElement) {
          lineElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          container.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    } else {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [lines, readingProgress.currentLocation.lineIndex]);

  // 滚动停止后保存当前阅读位置
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        const containerRect = container.getBoundingClientRect();
        const containerTop = containerRect.top + 10;

        // 找出视口中第一个可见的非空行
        let visibleLineIndex = Infinity;

        for (let i = 0; i < lines.length; i++) {
          if (!lines[i]) continue;

          const lineElement = lineRefsMap.current.get(i);
          if (!lineElement) continue;

          const lineRect = lineElement.getBoundingClientRect();

          if (lineRect.bottom >= containerTop &&
            lineRect.top <= (containerRect.top + containerRect.height)) {
            visibleLineIndex = i;
            break;
          }
        }

        // save
        if (visibleLineIndex !== Infinity && visibleLineIndex >= 0) {
          scheduleSaveLocation(readingProgress.currentLocation.chapterIndex, visibleLineIndex)
        }
      }, 300);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [book.id, readingProgress.currentLocation.chapterIndex, lines]);
  useEffect(() => {
    return () => {
      if (saveStateRef.current.timer) clearTimeout(saveStateRef.current.timer)
    }
  }, [])

  // 处理行点击
  const handleLineClick = useCallback((index: number) => {
    setSelectedLine((prev) => {
      EventEmitter.emit(EVENT_NAMES.SEND_LINE_INDEX, index);
      if (prev !== index) {
        scheduleSaveLocation(readingProgress.currentLocation.chapterIndex, index)
      }
      return index;
    });
  }, [readingProgress.currentLocation.chapterIndex, scheduleSaveLocation]);

  // 记录每行DOM引用
  const setLineRef = useCallback((element: HTMLDivElement | null, index: number) => {
    if (element) {
      lineRefsMap.current.set(index, element);
    } else {
      lineRefsMap.current.delete(index);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className='w-full h-full overflow-auto p-2'
    >
      <div className={`${titleFontSizeClasses[fontSize]} font-bold mb-4 ml-8`}>{title}</div>
      <div className={fontSizeClasses[fontSize]}>
        {lines.length > 0 && lines.map((sentence, index) => (
          <Line
            sentence={sentence}
            index={index}
            isSelected={selectedLine === index}
            key={index}
            handleLineClick={handleLineClick}
            setLineRef={setLineRef}
            size={fontSize}
          />
        ))}
      </div>
    </div>
  )
}

// 单行组件，使用memo优化性能
const Line = React.memo(({ sentence, index, isSelected, handleLineClick, setLineRef, size }: {
  sentence: string,
  index: number,
  isSelected: boolean,
  handleLineClick: (index: number) => void,
  setLineRef: (element: HTMLDivElement | null, index: number) => void,
  size: FontSize
}) => {
  if (!sentence) {
    return <div className="h-4" />
  }
  const radioSizeClasses = {
    small: 'w-5 h-5 pt-0.5',
    medium: 'w-6 h-6 pt-[4.5px]',
    large: 'w-7 h-7 pt-[5px]'
  }

  return (
    <div
      className={`flex mb-1 group rounded-lg min-h-[1.5em] ${isSelected ? 'bg-[var(--ant-color-bg-text-hover)]' : ''} hover:bg-[var(--ant-color-bg-text-hover)]`}
      ref={(el) => setLineRef(el, index)}
    >
      <div
        className={`${radioSizeClasses[size]}  flex justify-center items-center`}
        onClick={() => handleLineClick(index)}
      >
        <Radio
          checked={isSelected}
          className={`${isSelected ? "" : "hidden group-hover:block"}`}
        />
      </div>
      <div className={`mx-1`} />
      <div className="flex-1 leading-relaxed">{sentence}</div>
    </div>
  )
})
Line.displayName = 'Line'
