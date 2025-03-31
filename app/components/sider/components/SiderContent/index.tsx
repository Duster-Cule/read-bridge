'use client'

import { useReadingProgress } from "@/hooks/useReadingProgress"
import { EVENT_NAMES } from "@/services/EventService"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { EventEmitter } from "@/services/EventService"
import { useLLMStore } from "@/store/useLLMStore"
import { createLLMClient } from "@/services/llm"
import PROMPT from "@/constants/prompt"
import nlp from "compromise"
import { Divider, Menu, MenuProps, Tooltip } from "antd"

export default function SiderContent() {
  const [sentence, setSentence] = useState<string>("")

  const [sentenceAnalysis, setSentenceAnalysis] = useState<string>("")
  const [wordAnalysis, setwordAnalysis] = useState<string>("")

  const [selectedTab, setSelectedTab] = useState<string>("sentence-analysis")

  const [word, setWord] = useState<string>("")
  const [wordDetails, setWordDetails] = useState<{ [key: string]: string }>({})

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

  // 处理行索引
  async function handleLineIndex(index: number) {
    const text = currentChapter[index] || ""
    setSentence(text)
    setSentenceAnalysis("")
    setwordAnalysis("")
    if (!text || !defaultLLMClient) return

    const sentenceAnalysisPromise = (async () => {
      const sentenceAnalysis = defaultLLMClient.completionsGenerator([{ role: 'user', content: text }], PROMPT.SENTENCE_ANALYSIS)
      for await (const chunk of sentenceAnalysis) {
        setSentenceAnalysis((prev) => prev + chunk)
      }
    })();

    const wordAnalysisPromise = (async () => {
      const wordAnalysis = defaultLLMClient.completionsGenerator([{ role: 'user', content: text }], PROMPT.TEXT_ANALYSIS)
      for await (const chunk of wordAnalysis) {
        setwordAnalysis((prev) => prev + chunk)
      }
    })();

    await Promise.all([sentenceAnalysisPromise, wordAnalysisPromise]);
  }

  useEffect(() => {
    const unsub = EventEmitter.on(EVENT_NAMES.SEND_LINE_INDEX, handleLineIndex)
    return () => {
      unsub()
    }
  }, [currentChapter])

  // 菜单项
  const items = useCallback(() => {
    return [
      {
        label: 'Sentence Analysis',
        key: 'sentence-analysis',
      },
      {
        label: 'Word Details',
        key: 'word-details',
        disabled: !word,
      },
    ]
  }, [word])
  const handleTabChange = useCallback((key: string) => {
    setSelectedTab(key)
  }, [])

  // 处理点击单词
  async function handleWord(word: string) {
    setWord(word)
    handleTabChange('word-details')
    if (!defaultLLMClient) return
    if (wordDetails[word]) return
    const wordDetailGenerator = defaultLLMClient.completionsGenerator([{ role: 'user', content: `${word} ${sentence}` }], PROMPT.WORD_DETAILS)
    for await (const chunk of wordDetailGenerator) {
      setWordDetails((prev) => ({ ...prev, [word]: (prev[word] || "") + chunk }))
    }
  }
  return (
    <div className="w-full h-full flex flex-col">
      <CurrentSentence sentence={sentence} handleWord={handleWord} />
      <Divider className="my-0" />
      <MenuLine selectedTab={selectedTab} items={items()} onTabChange={handleTabChange} />
      {selectedTab === 'sentence-analysis' && (
        <Sentences sentenceAnalysis={sentenceAnalysis} wordAnalysis={wordAnalysis} />
      )}
      {selectedTab === 'word-details' && (
        <WordDetails word={word} wordDetails={wordDetails} />
      )}
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
    <div className="w-full h-[136px] p-4 ">
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
      <div className="space-y-1 overflow-y-auto h-[76px]">
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


function MenuLine({
  selectedTab,
  items,
  onTabChange
}: {
  selectedTab: string,
  items: { label: string, key: string, disabled?: boolean }[],
  onTabChange: (key: string) => void
}) {
  const onClick: MenuProps['onClick'] = (e) => {
    onTabChange(e.key);
  };

  return (
    <Menu
      mode="horizontal"
      items={items}
      selectedKeys={[selectedTab]}
      onClick={onClick}
      className="w-full [&_.ant-menu-item]:flex-1 [&_.ant-menu-item]:text-center [&_.ant-menu-item::after]:!w-full [&_.ant-menu-item::after]:!left-0"
    />
  )
}

function Sentences({ sentenceAnalysis, wordAnalysis }: { sentenceAnalysis: string, wordAnalysis: string }) {
  return (
    <div>
      {sentenceAnalysis}
      <Divider className="my-0" />
      {wordAnalysis}
    </div>
  )
}

function WordDetails({ word, wordDetails }: { word: string, wordDetails: { [key: string]: string } }) {
  return (
    <div>
      {word}
      {wordDetails[word]}
    </div>
  )
}
