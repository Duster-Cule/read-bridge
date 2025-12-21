import { EVENT_NAMES, EventEmitter } from "@/services/EventService"
import { createLLMClient } from "@/services/llm"
import { useLLMStore } from "@/store/useLLMStore"
import getGeneratorThinkAndHTMLTag from "@/utils/generator"
import { Divider, Empty, App } from "antd"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CurrentSentence, MenuLine, Sentences, Dictionary } from "./cpns"
import { useOutputOptions } from "@/store/useOutputOptions"
import { assemblePrompt, contextMessages, OUTPUT_TYPE } from "@/constants/prompt"
import { OUTPUT_PROMPT } from "@/constants/prompt"
import { useTranslation } from "@/i18n/useTranslation"
import { useTTSStore } from "@/store/useTTSStore"
import { createTTSSpeak } from "@/services/ttsService"
import { useTheme } from 'next-themes'
import { ReadingProgress } from "@/types/book"
import { SentenceProcessing } from "@/types/cache"
import { cacheService } from "@/services/CacheService"
import { createCacheGenerator } from "@/utils/cacheGenerator"
import { Client as LLMClient, Model } from "@/types/llm"
import { useBookmarkStore } from "@/store/useBookmarkStore"
import { ContextMenuItem } from "@/types/contextMenu"
import { WordDetail } from "@/types/dict"
import { normalizeDictQuery } from "@/utils/dictQuery"


/**
 * 创建句子生成器（集成缓存逻辑）
 */
async function createSentenceGenerator(
  option: { id: string; name: string; type: string; rulePrompt: string },
  text: string,
  bookId: string,
  defaultLLMClient: LLMClient,
  theme: string,
  signal: AbortSignal
): Promise<{
  generator: AsyncGenerator<string, void, unknown> | null,
  fromCache: boolean,
  signal: AbortSignal
}> {
  const { type, rulePrompt, id } = option

  // 生成缓存键参数，如果没有bookId则使用空字符串
  const cacheParams = {
    bookId: bookId || '',
    sentence: text,
    ruleId: id
  }

  try {
    // 尝试从缓存获取数据
    const cacheItem = await cacheService.get(cacheParams)

    if (cacheItem) {
      // 缓存命中：创建模拟generator返回缓存数据
      return {
        generator:
          type === OUTPUT_TYPE.MD || type === OUTPUT_TYPE.TEXT ?
            createCacheGenerator(cacheItem) :
            getGeneratorThinkAndHTMLTag(createCacheGenerator(cacheItem)),
        fromCache: true,
        signal
      }
    }

    // 缓存未命中：创建真实LLM generator
    let generator: AsyncGenerator<string, void, unknown> | null = null

    if (type === OUTPUT_TYPE.MD) {
      generator = defaultLLMClient.completionsGenerator(
        contextMessages(text),
        assemblePrompt(rulePrompt, `theme: ${theme} output: ${OUTPUT_PROMPT[type]}`),
        signal
      )
    } else {
      generator = getGeneratorThinkAndHTMLTag(
        defaultLLMClient.completionsGenerator(
          contextMessages(text),
          assemblePrompt(rulePrompt, OUTPUT_PROMPT[type]),
          signal
        )
      )
    }

    return {
      generator,
      fromCache: false,
      signal
    }
  } catch (error) {
    console.error('创建句子生成器失败:', error)
    return {
      generator: null,
      fromCache: false,
      signal
    }
  }
}

export default function SiderContent() {
  const { message } = App.useApp()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [sentenceProcessingList, setSentenceProcessingList] = useState<SentenceProcessing[]>([])
  const [customQueryList, setCustomQueryList] = useState<SentenceProcessing[]>([])
  const { sentenceOptions, batchProcessingSize } = useOutputOptions()
  const [sentence, setSentence] = useState<string>("")

  const [selectedTab, setSelectedTab] = useState<string>("sentence-analysis")
  const [dictionaryData, setDictionaryData] = useState<WordDetail | null>(null)
  const [dictionaryLoading, setDictionaryLoading] = useState(false)

  // 书签相关状态
  const [currentBookmarkInfo, setCurrentBookmarkInfo] = useState<{
    bookId: string;
    sentence: string;
    chapterIndex: number;
    lineIndex: number;
  } | null>(null);

  const { addBookmark, removeBookmark, getBookmarksByBookId } = useBookmarkStore();

  const { parseModel } = useLLMStore()
  const { ttsProvider, ttsGlobalConfig, ttsConfig } = useTTSStore()

  // 创建TTS服务实例
  const speak = useMemo(() => {
    if (ttsGlobalConfig.autoSentenceTTS || ttsGlobalConfig.autoWordTTS) {
      return createTTSSpeak(ttsProvider, ttsConfig)
    } else return null
  }, [ttsProvider, ttsConfig, ttsGlobalConfig.autoSentenceTTS, ttsGlobalConfig.autoWordTTS])

  const controllerRef = useRef<AbortController | null>(null);
  const defaultLLMClient = useMemo(() => {
    return parseModel
      ? createLLMClient(parseModel, {
        max_tokens: 2000
      })
      : null
  }, [parseModel])


  const processingSentences = useCallback((text: string, bookId: string) => {
    // 阅读
    if (speak && text && ttsGlobalConfig.autoSentenceTTS) {
      speak(text)
    }

    // 判断句子是否相同 如相同则只阅读即可
    let skip = false
    setSentence(prev => prev === text ? (skip = true, prev) : text)
    if (skip) return

    // 取消之前的请求
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    // 创建新的 controller
    controllerRef.current = new AbortController();
    const { signal } = controllerRef.current;
    setSelectedTab("sentence-analysis")
    if (!text || !defaultLLMClient) return

    // 清空现有列表
    setSentenceProcessingList([])

    const addProcessorsWithDelay = async () => {
      for (let i = 0; i < sentenceOptions.length; i++) {
        const option = sentenceOptions[i]
        const { name, type, id } = option

        try {
          const { generator, fromCache, signal: generatorSignal } = await createSentenceGenerator(
            option,
            text,
            bookId,
            defaultLLMClient,
            theme || '',
            signal
          )

          if (generator) {
            setSentenceProcessingList(prev => [...prev, {
              name,
              type,
              generator,
              id,
              text,
              fromCache,
              bookId,
              signal: generatorSignal  // 传递signal到SentenceProcessing
            }])
          }
        } catch (error) {
          console.log(t('common.templates.analysisFailed', { entity: t('common.entities.sentenceAnalysisGeneric') }), error, name, type, text)
        }

        if (i < sentenceOptions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }

      // 处理完成后触发缓存清理
      await cacheService.clearCacheOnTriggerEvents()
    }

    // 执行添加处理器的函数
    addProcessorsWithDelay()
  }, [defaultLLMClient, sentenceOptions, speak, ttsGlobalConfig.autoSentenceTTS, theme, t])

  // 处理行索引
  const handleLineIndex = useCallback(async (readingProgress: ReadingProgress) => {
    // 取出lineindex和currentChapter
    const { currentLocation, sentenceChapters, bookId } = readingProgress
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

    // 维护当前书签信息
    setCurrentBookmarkInfo({
      bookId,
      sentence: currentChapter[index], // 书签不需要存储发送文本
      chapterIndex,
      lineIndex: index
    });

    processingSentences(text, bookId)
  }, [batchProcessingSize, processingSentences])

  // 书签操作函数
  const handleBookmarkToggle = useCallback(() => {
    if (!currentBookmarkInfo) return;

    const { bookId, sentence, chapterIndex, lineIndex } = currentBookmarkInfo;
    const bookmarks = getBookmarksByBookId(bookId);
    const existingBookmark = bookmarks.find(bookmark =>
      bookmark.chapterIndex === chapterIndex &&
      bookmark.lineIndex === lineIndex
    );

    if (existingBookmark) {
      removeBookmark(bookId, existingBookmark.id);
    } else {
      addBookmark({
        bookId,
        sentence,
        chapterIndex,
        lineIndex
      });
    }
  }, [currentBookmarkInfo, addBookmark, removeBookmark, getBookmarksByBookId]);

  const handleDictQuery = useCallback(async (text: string) => {
    const query = normalizeDictQuery(text)
    if (!query) return

    setSelectedTab("dictionary")
    setDictionaryLoading(true)
    setDictionaryData(null)

    try {
      const resp = await fetch(`/api/dict/query?word=${encodeURIComponent(query)}`)

      const contentType = resp.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const textBody = await resp.text()
        throw new Error(`Dict API returned non-JSON (${resp.status}). ${textBody.slice(0, 120)}`)
      }

      const payload = (await resp.json()) as { ok: boolean; data: WordDetail | null; error?: string }
      if (!resp.ok || !payload.ok) {
        throw new Error(payload.error || `HTTP ${resp.status}`)
      }

      setDictionaryData(payload.data)
    } catch (error) {
      console.error('Dictionary query failed:', error)
      message.error(String(error))
    } finally {
      setDictionaryLoading(false)
    }
  }, [setSelectedTab, message])

  // 词典数据刷新后自动发音（覆盖右键/Alt 查词入口）
  useEffect(() => {
    const word = dictionaryData?.word
    if (!word) return
    if (!speak || !ttsGlobalConfig.autoWordTTS) return

    speak(word)
  }, [dictionaryData?.word, speak, ttsGlobalConfig.autoWordTTS])

  // 处理右键菜单事件
  const handleSelectionMenu = useCallback(async (data: { text: string, context?: string, menuItem: ContextMenuItem, model: Model }) => {
    const { text, context, menuItem, model } = data
    
    // 切换到自定义查询 Tab
    setSelectedTab("custom-query")
    
    // 取消之前的请求
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    
    // 创建新的 controller
    controllerRef.current = new AbortController();
    const { signal } = controllerRef.current;
    
    // 清空现有列表
    setCustomQueryList([])
    
    // 创建 LLM Client
    const client = createLLMClient(model)
    
    // 替换 prompt 中的变量
    // {{selection}} -> 选中的文本
    // {{context}} 或 {{paragraph}} -> 上下文（段落）
    let prompt = menuItem.prompt.replace(/\{\{selection\}\}/g, text)
    
    // 如果选中的文字与上下文一致（或者非常接近），则不发送上下文，避免重复
    const isContextSameAsSelection = context && text && context.trim() === text.trim();
    const effectiveContext = isContextSameAsSelection ? '' : context;

    if (effectiveContext) {
      prompt = prompt.replace(/\{\{context\}\}/g, effectiveContext)
      prompt = prompt.replace(/\{\{paragraph\}\}/g, effectiveContext)
    } else {
      // 如果没有 context 或者 context 与 selection 相同，则将 context 占位符替换为空字符串或者移除相关描述
      // 这里简单地替换为空字符串，提示词设计时应考虑这种情况
      prompt = prompt.replace(/\{\{context\}\}/g, '')
      prompt = prompt.replace(/\{\{paragraph\}\}/g, '')
    }
    
    try {
      // 直接创建 generator
      const generator = client.completionsGenerator(
        [{ role: 'user', content: prompt }],
        undefined, 
        signal
      )
      
      // 添加到处理列表
      setCustomQueryList([{
        name: menuItem.name,
        type: OUTPUT_TYPE.MD, 
        generator,
        id: menuItem.id,
        text,
        fromCache: false,
        bookId: '', 
        signal
      }])
      
    } catch (error) {
      console.error('右键菜单处理失败:', error)
    }
    
  }, [setCustomQueryList, setSelectedTab])

  const handleSelectedSentence = useCallback(async (data: { text: string; bookId: string }) => {
    const { text, bookId } = data
    // PDF 模式下无法通过 lineIndex 定位，直接以文本作为“当前句子”触发分析
    setCurrentBookmarkInfo(null)
    processingSentences(text, bookId)
  }, [processingSentences])

  useEffect(() => {
    const unsubMenu = EventEmitter.on(EVENT_NAMES.HANDLE_SELECTION_MENU, handleSelectionMenu)
    const unsubDict = EventEmitter.on(EVENT_NAMES.HANDLE_DICT_QUERY, handleDictQuery)
    const unsub = EventEmitter.on(EVENT_NAMES.SEND_MESSAGE, handleLineIndex)
    const unsubSelectedSentence = EventEmitter.on(EVENT_NAMES.SEND_SELECTED_SENTENCE, handleSelectedSentence)
    return () => {
      unsubMenu()
      unsubDict()
      unsub()
      unsubSelectedSentence()
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    }
  }, [handleDictQuery, handleLineIndex, handleSelectionMenu, handleSelectedSentence])

  // 菜单项
  const items = useMemo(() => {
    return [
      {
        label: t('sider.sentenceAnalysis'),
        key: 'sentence-analysis',
      },
      {
        label: t('sider.dictionary'),
        key: 'dictionary',
        disabled: !dictionaryData && !dictionaryLoading
      },
      {
        label: t('sider.aiAssistant'),
        key: 'custom-query',
        disabled: customQueryList.length === 0
      }
    ];
  }, [t, customQueryList, dictionaryData, dictionaryLoading]);
  const handleTabChange = useCallback((key: string) => {
    setSelectedTab(key)
  }, [setSelectedTab])

  // 处理点击单词
  const handleWord = useCallback(async (word: string) => {
    // 统一跳转到词典查询
    await handleDictQuery(word)
  }, [handleDictQuery])


  const handleEditComplete = useCallback((text: string) => {
    setSentence(text)
    processingSentences(text, '')
    // 清除书签信息，因为句子已被手动编辑
    setCurrentBookmarkInfo(null);
  }, [processingSentences, setSentence])

  return (
    <div className="w-full h-[calc(100%-32px)] flex flex-col">
      <CurrentSentence
        sentence={sentence}
        handleWord={handleWord}
        onEditComplete={handleEditComplete}
        currentBookmarkInfo={currentBookmarkInfo}
        onBookmarkToggle={handleBookmarkToggle}
      />
      <Divider className="my-0" />
      <MenuLine selectedTab={selectedTab} items={items} onTabChange={handleTabChange} />
      <div className={`${selectedTab === 'sentence-analysis' ? 'flex flex-col flex-1 min-h-0' : 'hidden'}`}>
        {sentenceProcessingList.length > 0 ?
          <Sentences sentenceProcessingList={sentenceProcessingList} />
          : <Empty description={parseModel ? t('sider.noSentenceSelected') : t('sider.noAnalysisModelSelected')} className="flex flex-col items-center justify-center h-[262px]" />}
      </div>
      <div className={`${selectedTab === 'dictionary' ? 'flex flex-col flex-1 min-h-0' : 'hidden'}`}>
        <Dictionary data={dictionaryData} loading={dictionaryLoading} />
      </div>
      <div className={`${selectedTab === 'custom-query' ? 'flex flex-col flex-1 min-h-0' : 'hidden'}`}>
        {customQueryList.length > 0 ?
          <Sentences sentenceProcessingList={customQueryList} />
          : <Empty description={t('sider.noCustomQuery')} className="flex flex-col items-center justify-center h-[262px]" />}
      </div>
      <Divider className="my-0" />
    </div>
  )
}

