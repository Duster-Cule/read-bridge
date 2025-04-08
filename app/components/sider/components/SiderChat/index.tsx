import { Button, Divider, Popover } from "antd"
import { PlusOutlined, HistoryOutlined, SendOutlined } from "@ant-design/icons"
import { useHistoryStore } from "@/store/useHistoryStore"
import { LLMHistory } from "@/types/llm"
import { Input } from "postcss"
import TextArea from "antd/es/input/TextArea"
import { useState } from "react"

export default function StandardChat() {
  const { historys, setHistory } = useHistoryStore()
  function handlePlus() {
  }
  function handleHistory() {
  }
  return (
    <div className="w-full h-full flex flex-col text-[var(--ant-color-text)]">
      <ChatTools onPlus={handlePlus} onHistory={handleHistory} historys={historys} />
      <Divider className="my-0" />
      <ChatContent />
      <Divider className="my-0" />
      <ChatInput />
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
    <div className="w-full h-[42px] flex items-center justify-end p-2">
      <div className="mr-auto text-sm font-bold">Reading Assistant</div>
      <Button type="text" icon={<PlusOutlined />} onClick={onPlus} />
      <Popover content={historyContent()} placement="leftTop" trigger="click">
        <Button type="text" icon={<HistoryOutlined />} onClick={onHistory} />
      </Popover>
    </div>
  )
}

function ChatContent() {
  return (
    <div className="w-full flex-1">
      456546
    </div>
  )
}

function ChatInput() {
  const [input, setInput] = useState('')
  return (
    <div className="w-full min-h-[50px] flex items-center flex-col justify-between">
      <div className="w-full h-[16px]">

      </div>
      <div className=" flex-1 w-full flex items-end justify-between">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} />
        <Button className="ml-2" type="text" icon={<SendOutlined />} disabled={input.length === 0} />
      </div>

    </div>
  )
}
