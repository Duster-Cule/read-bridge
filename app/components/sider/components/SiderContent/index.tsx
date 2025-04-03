import { EVENT_NAMES, EventEmitter } from "@/services/EventService"
import { createLLMClient } from "@/services/llm"
import { useLLMStore } from "@/store/useLLMStore"
import getGeneratorHTMLULList from "@/utils/generator"
import { Divider, Empty } from "antd"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CurrentSentence, MenuLine, Sentences, WordDetails } from "./cpns"
import PROMPT from "@/constants/prompt"

interface SiderContentProps {
  currentChapter: string[]
}

export default function SiderContent({ currentChapter }: SiderContentProps) {
  const [sentence, setSentence] = useState<string>("")

  const [sentenceAnalysis, setSentenceAnalysis] = useState<string[]>([])
  const [wordAnalysis, setwordAnalysis] = useState<string[]>([])

  const [selectedTab, setSelectedTab] = useState<string>("sentence-analysis")

  const [word, setWord] = useState<string>("")
  const [wordDetails, setWordDetails] = useState<string>("")

  const [sentenceRewrite, setSentenceRewrite] = useState<string>("")

  const { defaultModel } = useLLMStore()

  const controllerRef = useRef<AbortController | null>(null);
  // TODO: 后续增加不同功能选择LLMClient
  const defaultLLMClient = useMemo(() => {
    return defaultModel
      ? createLLMClient(defaultModel)
      : null
  }, [defaultModel])

  // 处理行索引
  const handleLineIndex = useCallback(async (index: number) => {
    // 取消之前的请求
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    // 创建新的 controller
    controllerRef.current = new AbortController();
    const { signal } = controllerRef.current;


    const text = currentChapter[index] || ""
    setSelectedTab("sentence-analysis")
    setSentence(text)
    setSentenceRewrite("")
    setWord("")
    setWordDetails("")
    setSentenceAnalysis([])
    setwordAnalysis([])
    if (!text || !defaultLLMClient) return

    const sentenceAnalysisPromise = async () => {
      const sentenceAnalysis = defaultLLMClient.completionsGenerator([{ role: 'user', content: text }], PROMPT.SENTENCE_ANALYSIS, signal)
      for await (const chunk of getGeneratorHTMLULList(sentenceAnalysis)) {
        setSentenceAnalysis((prev) => [...prev, chunk])
      }
    };
    const sentenceRewritePromise = async () => {
      const sentenceRewrite = defaultLLMClient.completionsGenerator([{ role: 'user', content: text }], PROMPT.SENTENCE_REWRITE, signal)
      for await (const chunk of sentenceRewrite) {
        setSentenceRewrite((prev) => prev + chunk)
      }
    };
    const wordAnalysisPromise = async () => {
      const wordAnalysis = defaultLLMClient.completionsGenerator([{ role: 'user', content: `2 ${text}` }], PROMPT.TEXT_ANALYSIS, signal)
      for await (const chunk of getGeneratorHTMLULList(wordAnalysis)) {
        setwordAnalysis((prev) => [...prev, chunk])
      }
    };


    [sentenceAnalysisPromise, sentenceRewritePromise, wordAnalysisPromise].forEach((fn, index) => {
      setTimeout(() => {
        fn();
      }, 500 * index);
    });
  }, [currentChapter, defaultLLMClient])

  useEffect(() => {
    const unsub = EventEmitter.on(EVENT_NAMES.SEND_LINE_INDEX, handleLineIndex)
    return () => {
      unsub()
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    }
  }, [currentChapter, handleLineIndex])

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

  const wordAbortControllerRef = useRef<AbortController | null>(null)
  // 处理点击单词
  const handleWord = useCallback(async (word: string) => {
    if (wordAbortControllerRef.current) {
      wordAbortControllerRef.current.abort();
    }
    wordAbortControllerRef.current = new AbortController();
    const { signal } = wordAbortControllerRef.current;

    let isSame = false
    setWord((prev) => {
      if (prev === word) {
        isSame = true
        return prev
      }
      else return word
    })
    if (isSame) return
    setWordDetails("")
    handleTabChange('word-details')
    if (!defaultLLMClient) return
    const wordDetailGenerator = defaultLLMClient.completionsGenerator([{ role: 'user', content: `${word} ${sentence}` }], PROMPT.WORD_DETAILS, signal)
    for await (const chunk of wordDetailGenerator) {
      if (!chunk) continue
      setWordDetails((prev) => (prev || "") + chunk)
    }
  }, [defaultLLMClient, handleTabChange, sentence])
  return (
    <div className="w-full h-[534px] flex flex-col">
      <CurrentSentence sentence={sentence} handleWord={handleWord} />
      <Divider className="my-0" />
      <MenuLine selectedTab={selectedTab} items={items()} onTabChange={handleTabChange} />
      {selectedTab === 'sentence-analysis' && (
        sentence ? <Sentences sentenceAnalysis={sentenceAnalysis} wordAnalysis={wordAnalysis} sentenceRewrite={sentenceRewrite} /> : <Empty description="No sentence selected" className="flex flex-col items-center justify-center h-[262px]" />
      )}
      {selectedTab === 'word-details' && (
        word ? <WordDetails wordDetails={wordDetails} /> : <Empty description="No word selected" className="flex flex-col items-center justify-center h-[262px]" />
      )}
      <Divider className="my-0" />
    </div>
  )
}

