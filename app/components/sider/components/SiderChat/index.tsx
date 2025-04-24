import { message } from "antd"

import { useHistoryStore } from "@/store/useHistoryStore"
import { LLMHistory } from "@/types/llm"

import { useCallback, useMemo, useState, useRef, useEffect } from "react"
import { useLLMStore } from "@/store/useLLMStore"
import { createLLMClient } from "@/services/llm"
import { INPUT_PROMPT } from "@/constants/prompt"
import dayjs from "dayjs"
import { getNewHistory } from "@/store/useOutputOptions"
import { ChatTools, ChatContent, ChatInput } from "./cpns"
import { ChatCompletionMessageParam } from "openai/resources/index.mjs"
import { useOutputOptions } from "@/store/useOutputOptions"
interface SiderChatProps {
  currentChapter: string[]
  lineIndex: number
}
export default function StandardChat({ currentChapter, lineIndex }: SiderChatProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedId, promptOptions } = useOutputOptions()
  const [history, setHistory] = useState<LLMHistory>(() => getNewHistory(promptOptions, selectedId))
  const { historys, addHistory } = useHistoryStore()
  const { defaultModel } = useLLMStore()
  const defaultLLMClient = useMemo(() => {
    return defaultModel
      ? createLLMClient(defaultModel)
      : null
  }, [defaultModel])

  const [isGenerating, setIsGenerating] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  function handlePlus() {
    if (!history) return
    addHistory(history)
    setHistory(getNewHistory(promptOptions, selectedId))
  }

  function handleSelectHistory() {
    console.log('select history')
  }

  const tagOptions = useMemo(() => [
    {
      label: '周围文本',
      value: 'base_context'
    },
    {
      label: '当前章节',
      value: 'current_chapter'
    }
  ], [])

  const handleMessage = useCallback((messages: LLMHistory['messages'], chunk: string, name: string, isThinking: boolean, thinkingTime: number | null) => {
    const endMessage = messages[messages.length - 1]
    let updateMessage = { ...endMessage }
    if (endMessage?.role === 'assistant') {
      if (isThinking) updateMessage.reasoningContent += chunk
      else updateMessage.content += chunk
      if (thinkingTime) updateMessage.thinkingTime = thinkingTime
      return [...messages.slice(0, -1), updateMessage]
    } else {
      updateMessage = { role: 'assistant' as const, content: '', reasoningContent: '', timestamp: dayjs().unix(), name }
      if (isThinking) updateMessage.reasoningContent = chunk
      else updateMessage.content = chunk
      return [...messages, updateMessage]
    }
  }, [])

  const handleTags = useCallback((tags: string[]): ChatCompletionMessageParam[] => {
    const tagContext = tags.map(tag => {
      if (currentChapter.length === 0) return null
      switch (tag) {
        case 'base_context':
          if (tags.includes('current_chapter')) return null
          const bookContext = currentChapter.length > 0 ? currentChapter.slice(Math.max(lineIndex - 20, 0), Math.min(lineIndex + 20, currentChapter.length)).join('\n\n') : ''
          return {
            role: 'user',
            content: `I'm providing the following excerpt from a book as context:\n\n${bookContext}\n\nBased on this context, please answer: [user question]`
          }
        case 'current_chapter':
          return {
            role: 'user',
            content: `I'm providing the following excerpt from a book as context:\n\n${currentChapter.join('\n\n')}\n\nBased on this context, please answer: [user question]`
          }
      }
    })
    const filteredContext = tagContext.filter(Boolean) as ChatCompletionMessageParam[]
    const finalContext: ChatCompletionMessageParam[] = []
    filteredContext.forEach(ctx => {
      finalContext.push(ctx);
      finalContext.push({
        role: 'assistant',
        content: 'I\'ve received the context. Ready for your question.'
      });
    });
    return finalContext
  }, [currentChapter, lineIndex])

  const handleChat = useCallback(async (newHistory: LLMHistory, tags: string[]) => {
    if (!newHistory) throw new Error('newHistory is undefined')
    if (!defaultLLMClient) throw new Error('defaultLLMClient is undefined')
    if (newHistory.messages.length === 0) throw new Error('newHistory.messages is empty')

    setIsGenerating(true)

    // 中断控制
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    // 处理tag
    const tagContext = tags.length > 0 ? handleTags(tags) : []

    const messages = [...tagContext, ...newHistory.messages.map((msg) => ({
      role: msg.role,
      content: msg.content
    }))]
    const prompt = newHistory.prompt
    let isThinking = false
    let thinkingStartTime: number | null = null
    let thinkingTime: number | null = null
    try {
      const responseGenerator = defaultLLMClient.completionsGenerator(messages, prompt, signal)
      let currentMessages = handleMessage(newHistory.messages, '', defaultLLMClient.name, false, null)
      setHistory(prev => ({
        ...prev,
        messages: currentMessages
      }))
      for await (const chunk of responseGenerator) {
        if (chunk === '<think>') {
          isThinking = true
          thinkingStartTime = dayjs().unix()
          continue
        }
        if (chunk === '</think>') {
          isThinking = false
          thinkingTime = thinkingStartTime ? (dayjs().unix() - thinkingStartTime) : null
          continue
        }
        currentMessages = handleMessage(currentMessages, chunk, defaultLLMClient.name, isThinking, thinkingTime);
        thinkingTime = null
        setHistory(prev => ({
          ...prev,
          messages: currentMessages
        }));
      }
    } catch (error) {
      console.error('Chat generation error:', error)
      message.error('聊天生成出错')
    } finally {
      const wasAborted = abortControllerRef.current?.signal.aborted || false;

      if (wasAborted) {
        message.info('已中断聊天生成')
        setHistory(prev => ({
          ...prev,
          messages: handleMessage(prev.messages, '已中断聊天生成', defaultLLMClient.name, false, thinkingStartTime ? (dayjs().unix() - thinkingStartTime) : null)
        }));
      }

      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }, [defaultLLMClient, setHistory, handleMessage, handleTags])

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const handleSend = useCallback(async (input: string, tags: string[]) => {
    if (input.length === 0) return
    if (!defaultLLMClient) throw new Error('defaultLLMClient is undefined')
    const newHistory = await new Promise<LLMHistory>(resolve => {
      setHistory((prev) => {
        const newHistory = {
          ...prev,
          messages: [...prev.messages, { role: 'user', content: input, timestamp: dayjs().unix() }]
        } as LLMHistory
        resolve(newHistory)
        return newHistory
      })
    })
    handleChat(newHistory, tags)
  }, [defaultLLMClient, setHistory, handleChat])


  function handleChangePrompt(id: string) {
    const prompt = promptOptions.find(option => option.id === id)?.prompt
    if (!prompt) return
    setHistory(prev => {
      if (prompt === prev.prompt) return prev
      return {
        ...prev,
        prompt
      }
    })
  }
  return (
    <div ref={containerRef} className="w-full h-full flex flex-col text-[var(--ant-color-text)]">
      <ChatTools onPlus={handlePlus} onSelectHistory={handleSelectHistory} onChangePrompt={handleChangePrompt} />
      <ChatContent containerRef={containerRef} history={history} />
      <ChatInput
        onSent={handleSend}
        tagOptions={tagOptions}
        isGenerating={isGenerating}
        onStopGeneration={handleStopGeneration}
      />
    </div>
  )
}

