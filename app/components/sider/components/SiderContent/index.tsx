'use client'

import { useReadingProgress } from "@/hooks/useReadingProgress"
import { EVENT_NAMES } from "@/services/EventService"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { EventEmitter } from "@/services/EventService"
import { useLLMStore } from "@/store/useLLMStore"
import { createLLMClient } from "@/services/llm"
import { PROMPT_SENTENCE_ANALYSIS, PROMPT_TEXT_ANALYSIS } from "@/constants/prompt"
import nlp from "compromise"
import { Divider, Menu, MenuProps, Tooltip } from "antd"

export default function SiderContent() {
  const [sentence, setSentence] = useState<string>("")
  const [sentenceAnalysis, setSentenceAnalysis] = useState<string>("")
  const [textAnalysis, setTextAnalysis] = useState<string>("")

  const [readingProgress, updateReadingProgress] = useReadingProgress()
  const { defaultModel } = useLLMStore()

  // 当前章节
  const currentChapter = useMemo(() => {
    return readingProgress.sentenceChapters[readingProgress.currentLocation.chapterIndex]
  }, [readingProgress.sentenceChapters, readingProgress.currentLocation.chapterIndex])
  const pathname = usePathname()

  // TODO: 后续增加不同功能选择LLMClient
  const defaultLLMClient = useMemo(() => {
    return defaultModel
      ? createLLMClient(defaultModel)
      : null
  }, [defaultModel])

  // 当返回阅读页面时 更新阅读进度
  useEffect(() => {
    if (pathname.includes('/read')) {
      updateReadingProgress()
    }
  }, [updateReadingProgress, pathname])


  async function handleLineIndex(index: number) {
    const text = currentChapter[index] || ""
    setSentence(text)
    setSentenceAnalysis("")
    setTextAnalysis("")
    if (!text || !defaultLLMClient) return

    const sentenceAnalysisPromise = (async () => {
      const sentenceAnalysis = defaultLLMClient.completionsGenerator([{ role: 'user', content: text }], PROMPT_SENTENCE_ANALYSIS)
      for await (const chunk of sentenceAnalysis) {
        setSentenceAnalysis((prev) => prev + chunk)
      }
    })();

    const textAnalysisPromise = (async () => {
      const textAnalysis = defaultLLMClient.completionsGenerator([{ role: 'user', content: text }], PROMPT_TEXT_ANALYSIS)
      for await (const chunk of textAnalysis) {
        setTextAnalysis((prev) => prev + chunk)
      }
    })();

    await Promise.all([sentenceAnalysisPromise, textAnalysisPromise]);
  }

  useEffect(() => {
    const unsub = EventEmitter.on(EVENT_NAMES.SEND_LINE_INDEX, handleLineIndex)
    return () => {
      unsub()
    }
  }, [currentChapter])

  function handleWord(word: string) {
    console.log(word)
  }
  return (
    <div className="w-full h-full flex flex-col">
      <CurrentSentence sentence={sentence} handleWord={handleWord} />
      <Divider className="my-0" />
      <MenuLine />
      <div>
        {sentenceAnalysis}
      </div>
      <div>
        {textAnalysis}
      </div>
    </div>
  )
}

function CurrentSentence({ sentence, handleWord }: { sentence: string, handleWord: (word: string) => void }) {
  const wordTypeColors = {
    'Verb': 'text-[var(--ant-green-6)]',
    'Adjective': 'text-[var(--ant-purple-7)]',
    'Pivot': 'text-[var(--ant-gold-6)]',
    'Noun': 'text-[var(--ant-color-text)]',
  };
  const getChunkColor = useCallback((chunk: string) => {
    return wordTypeColors[chunk] || 'text-[var(--ant-color-text)]';
  }, []);
  const terms = useMemo(() => {
    if (sentence && sentence.length > 0) {
      const doc = nlp(sentence)
      return doc.terms().json()
    }
    return []
  }, [sentence])
  return (
    <div className="w-full h-[140px] p-4">
      <Tooltip
        title={
          <>
            <div className={getChunkColor('Verb')}>Verb</div>
            <div className={getChunkColor('Adjective')}>Adjective</div>
            <div className={getChunkColor('Pivot')}>Pivot</div>
            <div className={getChunkColor('Noun')}>Noun/Other</div>
          </>
        }
      >
        <div className="text-lg font-semibold text-[var(--ant-color-text)] cursor-help">
          CURRENT SENTENCE
        </div>
      </Tooltip>
      <div className="space-y-1 overflow-y-auto">
        {terms.map((term, i) => (
          <span
            key={i}
            className={`${getChunkColor(term.terms[0].chunk)} hover:underline cursor-pointer text-base`}
            onClick={() => {
              handleWord(term.text)
            }}
          >
            {term.text}{' '}
          </span>
        ))}
      </div>
    </div>
  )
}

const items = [
  {
    label: 'Sentence Analysis',
    key: 'sentence-analysis',
  },
  {
    label: 'Word Details',
    key: 'word-details',
  },
]
function MenuLine() {
  const [selectedKeys, setSelectedKeys] = useState<string>('sentence-analysis')
  const onClick: MenuProps['onClick'] = (e) => {
    setSelectedKeys(e.key);
  };
  return (
    <Menu
      mode="horizontal"
      items={items}
      selectedKeys={[selectedKeys]}
      onClick={onClick}
      className="w-full [&_.ant-menu-item]:flex-1 [&_.ant-menu-item]:text-center [&_.ant-menu-item::after]:!w-full [&_.ant-menu-item::after]:!left-0"
    />
  )
}
