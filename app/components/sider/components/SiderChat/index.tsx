import { message } from "antd"

import { useHistoryStore } from "@/store/useHistoryStore"
import { LLMHistory } from "@/types/llm"

import { useCallback, useMemo, useState, useRef } from "react"
import { useLLMStore } from "@/store/useLLMStore"
import { createLLMClient } from "@/services/llm"
import { INPUT_PROMPT } from "@/constants/prompt"
import dayjs from "dayjs"

import { ChatTools, ChatContent, ChatInput } from "./cpns"

export default function StandardChat() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<LLMHistory>(
    {
      id: self.crypto.randomUUID(),
      title: 'New Chat',
      timestamp: new Date().getTime(),
      prompt: INPUT_PROMPT.CHAT_PROMPT,
      messages: []
    }
  )
  const { historys, setHistory: setStoreHistory } = useHistoryStore()
  const { defaultModel } = useLLMStore()
  const defaultLLMClient = useMemo(() => {
    return defaultModel
      ? createLLMClient(defaultModel)
      : null
  }, [defaultModel])
  const [isGenerating, setIsGenerating] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  function handlePlus() {
  }
  function handleHistory() {
    setStoreHistory([])
  }

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

  const handleChat = useCallback(async (newHistory: LLMHistory) => {
    if (!newHistory) throw new Error('newHistory is undefined')
    if (!defaultLLMClient) throw new Error('defaultLLMClient is undefined')
    if (newHistory.messages.length === 0) throw new Error('newHistory.messages is empty')

    setIsGenerating(true)

    // Create a new AbortController for this chat
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    const messages = newHistory.messages.map((msg) => ({
      role: msg.role,
      content: msg.content
    }))
    const prompt = newHistory.prompt
    let isThinking = false
    let thinkingStartTime: number | null = null
    let thinkingTime: number | null = null
    try {
      const responseGenerator = defaultLLMClient.completionsGenerator(messages, prompt, signal)
      let currentMessages = newHistory.messages;

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
  }, [defaultLLMClient, setHistory, handleMessage])

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const handleSend = useCallback((input: string) => {
    if (input.length === 0) return
    if (!defaultLLMClient) throw new Error('defaultLLMClient is undefined')
    setHistory((prev) => {
      const newHistory = {
        ...prev,
        messages: [...(prev?.messages ?? []), { role: 'user', content: input, timestamp: dayjs().unix() }]
      } as LLMHistory
      handleChat(newHistory)
      return newHistory
    })

  }, [defaultLLMClient, setHistory, handleChat])

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col text-[var(--ant-color-text)]">
      <ChatTools onPlus={handlePlus} onHistory={handleHistory} historys={historys} />
      <ChatContent containerRef={containerRef} history={history} />
      <ChatInput
        onSent={handleSend}
        isGenerating={isGenerating}
        onStopGeneration={handleStopGeneration}
      />
    </div>
  )
}