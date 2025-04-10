import { Button, message, Popover } from "antd"
import { PlusOutlined, HistoryOutlined, ArrowUpOutlined } from "@ant-design/icons"
import { CopyIcon } from "@/assets/icon"
import { useHistoryStore } from "@/store/useHistoryStore"
import { LLMHistory } from "@/types/llm"
import TextArea from "antd/es/input/TextArea"
import { useCallback, useMemo, useState, useRef, useEffect, RefObject } from "react"
import { useLLMStore } from "@/store/useLLMStore"
import { createLLMClient } from "@/services/llm"
import { INPUT_PROMPT } from "@/constants/prompt"
import dayjs from "dayjs"
import { useTheme } from "next-themes"

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
  function handlePlus() {
  }
  function handleHistory() {
    setStoreHistory([])
  }

  const handleMessage = useCallback((messages: LLMHistory['messages'], chunk: string, name: string) => {
    const endMessage = messages[messages.length - 1]
    if (endMessage?.role === 'assistant') {
      return [...messages.slice(0, -1), { ...endMessage, content: endMessage.content + chunk }]
    } else {
      return [...messages, { role: 'assistant' as const, content: chunk, timestamp: new Date().getTime(), name }]
    }
  }, [])

  const handleChat = useCallback(async (newHistory: LLMHistory) => {
    if (!newHistory) throw new Error('newHistory is undefined')
    if (!defaultLLMClient) throw new Error('defaultLLMClient is undefined')
    if (newHistory.messages.length === 0) throw new Error('newHistory.messages is empty')
    const messages = newHistory.messages.map((msg) => ({
      role: msg.role,
      content: msg.content
    }))
    const prompt = newHistory.prompt
    const responseGenerator = await defaultLLMClient.completionsGenerator(messages, prompt)
    let currentMessages = newHistory.messages;

    for await (const chunk of responseGenerator) {
      currentMessages = handleMessage(currentMessages, chunk, defaultLLMClient.name);
      setHistory(prev => ({
        ...prev,
        messages: currentMessages
      }));
    }
  }, [defaultLLMClient, setHistory, handleMessage])

  const handleSend = useCallback((input: string) => {
    if (input.length === 0) return
    if (!defaultLLMClient) throw new Error('defaultLLMClient is undefined')
    setHistory((prev) => {
      const newHistory = {
        ...prev,
        messages: [...(prev?.messages ?? []), { role: 'user', content: input, timestamp: new Date().getTime() }]
      } as LLMHistory
      handleChat(newHistory)
      return newHistory
    })

  }, [defaultLLMClient, setHistory, handleChat])

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col text-[var(--ant-color-text)]">
      <ChatTools onPlus={handlePlus} onHistory={handleHistory} historys={historys} />
      <ChatContent containerRef={containerRef} history={history} />
      <ChatInput onSent={handleSend} />
    </div>
  )
}

function ChatTools({ onPlus, onHistory, historys }: { onPlus: () => void, onHistory: () => void, historys: LLMHistory[] }) {
  function historyContent() {
    return historys.length > 0 ? historys.map((history) => {
      return <div key={history.id}>{history.title}</div>
    }) : <div className="text-gray-500 text-sm">No history</div>
  }
  return (
    <>
      <div className="w-full h-[42px] flex items-center justify-end p-2 shadow-md">
        <div className="mr-auto text-sm font-bold">Reading Assistant</div>
        <Button type="text" icon={<PlusOutlined />} onClick={onPlus} />
        <Popover content={historyContent()} placement="leftTop" trigger="click">
          <Button type="text" icon={<HistoryOutlined />} onClick={onHistory} />
        </Popover>
      </div>
    </>
  )
}

function ChatContent({ history, containerRef }: { history: LLMHistory, containerRef: RefObject<HTMLDivElement> }) {
  const [height, setHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const height = containerRef.current.getBoundingClientRect().height;
    setHeight(height - 142);
  }, []);

  useEffect(() => {
    if (!contentRef.current) return;

    const observer = new MutationObserver(() => {
      contentRef.current?.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: 'smooth'
      });
    });

    observer.observe(contentRef.current, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={contentRef} className="overflow-y-auto p-2" style={{ height: Math.max(0, height) }}>
      <div className="text-sm text-gray-500 rounded-md
       p-2 line-clamp-2 overflow-hidden text-ellipsis mb-2 border border-[var(--ant-color-border)]">{history.prompt}</div>
      {history.messages.map((msg) => {
        if (msg.role === 'user') {
          return <MessageBubble key={msg.timestamp} msg={msg} isUser={true} />
        } else {
          return <MessageBubble key={msg.timestamp} msg={msg} isUser={false} />
        }
      })}
    </div>
  )
}

function MessageBubble({
  msg,
  isUser
}: {
  msg: LLMHistory['messages'][number],
  isUser: boolean
}) {
  const { theme } = useTheme();
  const isDarkMode = useMemo(() => theme === 'dark', [theme])
  const commonClasses = useMemo(() => {
    return {
      container: "flex flex-row mb-3 items-start" + (isUser ? ' justify-end' : ' justify-start'),
      bubbleWrapper: "max-w-[90%]" + (isUser ? ' ml-auto' : ' mr-auto'),
      timestampWrapper: "flex mb-1" + (isUser ? ' justify-end' : ' justify-start'),
      bubble: "p-2 rounded-md border border-[var(--ant-color-border)] text-sm" +
        (isUser
          ? isDarkMode ? ' bg-blue-300/40' : ' bg-blue-100'
          : isDarkMode ? ' bg-gray-800' : ' bg-gray-100 '),
      actionsWrapper: "flex mt-1 space-x-2" + (isUser ? ' justify-end' : ' justify-start'),
      name: "text-xs font-semibold",
      timestamp: "text-xs text-gray-500"
    };
  }, [isUser, isDarkMode])

  return (
    <div className={commonClasses.container}>
      <div className={commonClasses.bubbleWrapper}>
        <div className={commonClasses.timestampWrapper}>
          {!isUser && <span className={commonClasses.name}>{msg.name}</span>}
          <span className={commonClasses.timestamp}>
            {dayjs(msg.timestamp).format('MM-DD HH:mm')}
          </span>
        </div>
        <div className={commonClasses.bubble}>
          {msg.content}
        </div>
        <div className={commonClasses.actionsWrapper}>
          <Button
            type="text"
            size="small"
            icon={<CopyIcon />}
            onClick={() => {
              navigator.clipboard.writeText(msg.content)
              message.success('Copied to clipboard')
            }}
          />
        </div>
      </div>
    </div>
  )
}

function ChatInput({ onSent }: { onSent: (input: string) => void }) {
  const [input, setInput] = useState('')
  const handleSend = () => {
    onSent(input)
    setInput('')
  }
  return (
    <div className="box-border w-full h-[100px] flex items-center flex-col
     justify-between border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="w-full h-[28px] pl-2 pr-2 pt-1 flex items-center">
        <Button icon={<>@</>} size="small" />
      </div>
      <div className="flex-1 w-full flex items-end justify-between p-2 relative">
        <TextArea
          className="resize-none pr-16"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoSize={{ minRows: 2, maxRows: 2 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              e.preventDefault();
              if (input.length > 0) {
                handleSend();
              }
            }
          }}
        />
        <Button
          className="absolute top-1/2 right-4 transform -translate-y-1/2"
          type="primary"
          shape="circle"
          icon={<ArrowUpOutlined />}
          disabled={input.length === 0}
          onClick={handleSend}
        />
      </div>
    </div>
  )
}
