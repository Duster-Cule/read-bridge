import { Button, Popover } from "antd"
import { PlusOutlined, HistoryOutlined } from "@ant-design/icons"
import { LLMHistory } from "@/types/llm"

export default function ChatTools({ onPlus, onHistory, historys }: { onPlus: () => void, onHistory: () => void, historys: LLMHistory[] }) {
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