import { EVENT_NAMES, EventEmitter } from "@/services/EventService"
import { createLLMClient } from "@/services/llm"
import { useLLMStore } from "@/store/useLLMStore"
import getGeneratorThinkAndHTMLTag from "@/utils/generator"
import { Divider, Empty } from "antd"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CurrentSentence, MenuLine, Sentences, WordDetails } from "./cpns"
import { useOutputOptions } from "@/store/useOutputOptions"
import { assemblePrompt, contextMessages, INPUT_PROMPT } from "@/constants/prompt"


interface SiderContentProps {
  currentChapter: string[]
}

export default function SiderContent({ currentChapter }: SiderContentProps) {
  const [sentenceProcessingList, setSentenceProcessingList] = useState<{ name: string, type: string, generator: AsyncGenerator<string, void, unknown> }[]>([])
  const { sentenceOptions } = useOutputOptions()
  const [sentence, setSentence] = useState<string>("")

  const [selectedTab, setSelectedTab] = useState<string>("sentence-analysis")

  const [word, setWord] = useState<string>("")
  const [wordDetails, setWordDetails] = useState<string>("")

  const { defaultModel } = useLLMStore()

  const controllerRef = useRef<AbortController | null>(null);
  // TODO: 后续增加不同功能选择LLMClient
  const defaultLLMClient = useMemo(() => {
    return defaultModel
      ? createLLMClient(defaultModel, {
        max_tokens: 600
      })
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
    setWord("")
    setWordDetails("")
    if (!text || !defaultLLMClient) return

    // 清空现有列表
    setSentenceProcessingList([])

    const addProcessorsWithDelay = async () => {
      for (let i = 0; i < sentenceOptions.length; i++) {
        const option = sentenceOptions[i]
        const { name, type, rulePrompt, outputPrompt } = option

        let generator: AsyncGenerator<string, void, unknown> | null = null
        try {
          generator = getGeneratorThinkAndHTMLTag(defaultLLMClient.completionsGenerator(contextMessages(text), assemblePrompt(rulePrompt, outputPrompt), signal))
        } catch (error) {
          console.log('句子请求失败', error, index, name, type, text)
        }

        if (generator) {
          setSentenceProcessingList(prev => [...prev, { name, type, generator }])
        }

        if (i < sentenceOptions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }
    }

    // 执行添加处理器的函数
    addProcessorsWithDelay()
  }, [currentChapter, defaultLLMClient, sentenceOptions, setSentenceProcessingList])

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
  const items = useMemo(() => {
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
    ];
  }, [word]);
  const handleTabChange = useCallback((key: string) => {
    setSelectedTab(key)
  }, [setSelectedTab])

  const wordAbortControllerRef = useRef<AbortController | null>(null)
  const isSameWord = useCallback((newWord: string) => {
    return new Promise((resolve) => {
      setWord((prev) => {
        if (prev === newWord) {
          resolve(true)
          return prev
        }
        else return newWord
      })
      resolve(false)
    })
  }, [setWord])

  // 处理点击单词
  const handleWord = useCallback(async (word: string) => {
    if (await isSameWord(word)) return
    if (wordAbortControllerRef.current) {
      wordAbortControllerRef.current.abort();
    }
    wordAbortControllerRef.current = new AbortController();
    const { signal } = wordAbortControllerRef.current;

    setWordDetails("")
    handleTabChange('word-details')
    if (!defaultLLMClient) return
    const wordDetailGenerator = defaultLLMClient.completionsGenerator([{ role: 'user', content: `${word} ${sentence}` }], INPUT_PROMPT.WORD_DETAILS, signal)
    for await (const chunk of wordDetailGenerator) {
      if (!chunk) continue
      setWordDetails((prev) => (prev || "") + chunk)
    }
  }, [defaultLLMClient, handleTabChange, sentence, isSameWord])
  return (
    <div className="w-full h-[534px] flex flex-col">
      <CurrentSentence sentence={sentence} handleWord={handleWord} />
      <Divider className="my-0" />
      <MenuLine selectedTab={selectedTab} items={items} onTabChange={handleTabChange} />
      <div className={`${selectedTab === 'sentence-analysis' ? 'block' : 'hidden'}`}>
        {sentenceProcessingList.length > 0 ? <Sentences sentenceProcessingList={sentenceProcessingList} /> : <Empty description="No sentence selected" className="flex flex-col items-center justify-center h-[262px]" />}
      </div>
      {selectedTab === 'word-details' && (
        word ? <WordDetails wordDetails={wordDetails} /> : <Empty description="No word selected" className="flex flex-col items-center justify-center h-[262px]" />
      )}
      <Divider className="my-0" />
    </div>
  )
}

