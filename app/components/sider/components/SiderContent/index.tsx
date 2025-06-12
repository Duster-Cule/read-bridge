import { EVENT_NAMES, EventEmitter } from "@/services/EventService"
import { createLLMClient } from "@/services/llm"
import { useLLMStore } from "@/store/useLLMStore"
import getGeneratorThinkAndHTMLTag from "@/utils/generator"
import { Divider, Empty } from "antd"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CurrentSentence, MenuLine, Sentences, WordDetails } from "./cpns"
import { useOutputOptions } from "@/store/useOutputOptions"
import { assemblePrompt, contextMessages, INPUT_PROMPT, OUTPUT_TYPE } from "@/constants/prompt"
import { OUTPUT_PROMPT } from "@/constants/prompt"
import { useTranslation } from "@/i18n/useTranslation"
import { useTTSStore } from "@/store/useTTSStore"
import { useTheme } from 'next-themes'
import { ReadingProgress } from "@/types/book"


export default function SiderContent() {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [sentenceProcessingList, setSentenceProcessingList] = useState<{ name: string, type: string, generator: AsyncGenerator<string, void, unknown>, id: string }[]>([])
  const { sentenceOptions, batchProcessingSize, wordOptions, selectedWordId } = useOutputOptions()
  const [sentence, setSentence] = useState<string>("")

  const [selectedTab, setSelectedTab] = useState<string>("sentence-analysis")

  const [word, setWord] = useState<string>("")
  const [wordDetails, setWordDetails] = useState<string>("")
  const wordOption = useMemo(() => {
    return wordOptions.find(option => option.id === selectedWordId) || wordOptions[0] || {
      id: crypto.randomUUID(),
      name: 'default',
      rulePrompt: INPUT_PROMPT.FUNC_WORD_DETAILS
    }
  }, [wordOptions, selectedWordId])

  const { parseModel } = useLLMStore()
  const { getSpeak, ttsGlobalConfig, ttsConfig } = useTTSStore()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const speak = useMemo(() => {
    if (ttsGlobalConfig.autoSentenceTTS || ttsGlobalConfig.autoWordTTS) {
      return getSpeak()
    } else return null
  }, [getSpeak, ttsGlobalConfig.autoSentenceTTS, ttsGlobalConfig.autoWordTTS, ttsConfig])
  const controllerRef = useRef<AbortController | null>(null);
  const defaultLLMClient = useMemo(() => {
    return parseModel
      ? createLLMClient(parseModel, {
        max_tokens: 2000
      })
      : null
  }, [parseModel])


  const processingSentences = useCallback((text: string) => {
    // 取消之前的请求
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    // 创建新的 controller
    controllerRef.current = new AbortController();
    const { signal } = controllerRef.current;
    // 阅读
    if (speak && text && ttsGlobalConfig.autoSentenceTTS) {
      speak(text)
    }
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
        const { name, type, rulePrompt, id } = option
        let generator: AsyncGenerator<string, void, unknown> | null = null
        try {
          if (type === OUTPUT_TYPE.MD) {
            generator = defaultLLMClient.completionsGenerator(contextMessages(text), assemblePrompt(rulePrompt, `theme: ${theme} output: ${OUTPUT_PROMPT[type]}`), signal)
          } else {
            generator = getGeneratorThinkAndHTMLTag(defaultLLMClient.completionsGenerator(contextMessages(text), assemblePrompt(rulePrompt, OUTPUT_PROMPT[type]), signal))
          }
        } catch (error) {
          console.log(t('common.templates.analysisFailed', { entity: t('common.entities.sentenceAnalysisGeneric') }), error, name, type, text)
        }
        if (generator) {
          setSentenceProcessingList(prev => [...prev, { name, type, generator, id }])
        }

        if (i < sentenceOptions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }
    }

    // 执行添加处理器的函数
    addProcessorsWithDelay()
  }, [defaultLLMClient, sentenceOptions, setSentenceProcessingList, batchProcessingSize, t])

  // 处理行索引
  const handleLineIndex = useCallback(async (readingProgress: ReadingProgress) => {
    // 取出lineindex和currentChapter
    const { currentLocation, sentenceChapters } = readingProgress
    const { chapterIndex, lineIndex: index } = currentLocation
    const currentChapter = sentenceChapters[chapterIndex]

    let text = ''
    try {
      let nextIndex = index;
      const texts: string[] = [];
      const targetSize = Math.min(batchProcessingSize, currentChapter.length - index);
      texts.push(currentChapter[nextIndex]);

      while (texts.length < targetSize) {
        nextIndex++;
        if (nextIndex >= currentChapter.length) break;
        const currentText = currentChapter[nextIndex];
        if (currentText.trim()) {
          texts.push(currentText);
        } else {
          nextIndex++;
          if (nextIndex < currentChapter.length) {
            texts.push(currentChapter[nextIndex]);
          }
        }
      }
      text = texts.join('\n')
    } catch (error) {
      console.log(error, '多句子处理错误')
      text = currentChapter[index]
    }

    processingSentences(text)
  }, [defaultLLMClient, sentenceOptions, setSentenceProcessingList, batchProcessingSize, t, processingSentences])

  useEffect(() => {
    const unsub = EventEmitter.on(EVENT_NAMES.SEND_MESSAGE, handleLineIndex)
    return () => {
      unsub()
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    }
  }, [handleLineIndex])

  // 菜单项
  const items = useMemo(() => {
    return [
      {
        label: t('sider.sentenceAnalysis'),
        key: 'sentence-analysis',
      },
      {
        label: t('sider.wordDetails'),
        key: 'word-details',
        disabled: !word,
      },
    ];
  }, [word, t]);
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
    // 阅读
    if (speak && word && ttsGlobalConfig.autoWordTTS) {
      speak(word)
    }

    if (await isSameWord(word)) return
    if (wordAbortControllerRef.current) {
      wordAbortControllerRef.current.abort();
    }
    wordAbortControllerRef.current = new AbortController();
    const { signal } = wordAbortControllerRef.current;

    setWordDetails("")
    handleTabChange('word-details')

    if (!defaultLLMClient) return
    const wordDetailGenerator = defaultLLMClient.completionsGenerator([{ role: 'user', content: `word:${word} sentence:${sentence}` }], wordOption.rulePrompt + OUTPUT_PROMPT.MD_WORD, signal)
    for await (const chunk of wordDetailGenerator) {
      if (!chunk) continue
      setWordDetails((prev) => (prev || "") + chunk)
    }
  }, [defaultLLMClient, handleTabChange, sentence, isSameWord, wordOption])


  const handleEditComplete = useCallback((text: string) => {
    setSentence(text)
    processingSentences(text)
  }, [processingSentences, setSentence])

  return (
    <div className="w-full h-full flex flex-col">
      <CurrentSentence sentence={sentence} handleWord={handleWord} onEditComplete={handleEditComplete} />
      <Divider className="my-0" />
      <MenuLine selectedTab={selectedTab} items={items} onTabChange={handleTabChange} />
      <div className={`${selectedTab === 'sentence-analysis' ? 'block' : 'hidden'}`}>
        {sentenceProcessingList.length > 0 ?
          <Sentences sentenceProcessingList={sentenceProcessingList} />
          : <Empty description={parseModel ? t('sider.noSentenceSelected') : t('sider.noAnalysisModelSelected')} className="flex flex-col items-center justify-center h-[262px]" />}
      </div>
      {selectedTab === 'word-details' && (
        (word && parseModel) ? <WordDetails wordDetails={wordDetails} />
          : <Empty description={parseModel ? t('sider.noWordSelected') : t('sider.noAnalysisModelSelected')} className="flex flex-col items-center justify-center h-[262px]" />
      )}
      <Divider className="my-0" />
    </div>
  )
}

