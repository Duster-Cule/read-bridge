import { Button, Divider, Popover } from "antd"
import { PlusOutlined, HistoryOutlined, ArrowUpOutlined } from "@ant-design/icons"
import { useHistoryStore } from "@/store/useHistoryStore"
import { LLMHistory } from "@/types/llm"
import TextArea from "antd/es/input/TextArea"
import { useCallback, useMemo, useState, useRef, useEffect, RefObject } from "react"
import { useLLMStore } from "@/store/useLLMStore"
import { createLLMClient } from "@/services/llm"
import { INPUT_PROMPT } from "@/constants/prompt"

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

  const handleMessage = useCallback((messages: LLMHistory['messages'], chunk: string) => {
    const endMessage = messages[messages.length - 1]
    if (endMessage?.role === 'assistant') {
      return [...messages.slice(0, -1), { ...endMessage, content: endMessage.content + chunk }]
    } else {
      return [...messages, { role: 'assistant' as const, content: chunk, timestamp: new Date().getTime() }]
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
      currentMessages = handleMessage(currentMessages, chunk);
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
      <div className="w-full h-[42px] flex items-center justify-end p-2">
        <div className="mr-auto text-sm font-bold">Reading Assistant</div>
        <Button type="text" icon={<PlusOutlined />} onClick={onPlus} />
        <Popover content={historyContent()} placement="leftTop" trigger="click">
          <Button type="text" icon={<HistoryOutlined />} onClick={onHistory} />
        </Popover>
      </div>
      <Divider className="my-0" />
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
    <div ref={contentRef} className="overflow-y-auto" style={{ height: Math.max(0, height) }}>
      {history.messages.map((msg) => {
        return <div key={msg.timestamp}>{msg.content}</div>
      })}
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
    <div className="box-border w-full h-[100px] flex items-center flex-col justify-between border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
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
