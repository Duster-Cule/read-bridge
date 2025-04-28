import { useHistoryStore } from "@/store/useHistoryStore";
import { Button, Modal } from "antd";
import { useCallback } from "react";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { LLMHistory } from "@/types/llm";
type ChatHistory = {
  isModalOpen: boolean
  onClose: () => void
  onSelect: (id: string) => void
}

export default function ChatHistory({ isModalOpen, onClose, onSelect }: ChatHistory) {
  const { groupHistoryByTime, history, deleteHistory } = useHistoryStore()
  const handleSelectHistory = useCallback((id: string) => {
    onSelect(id)
    onClose()
  }, [onSelect, onClose])
  const handleEditHistory = useCallback((item: LLMHistory) => {
    console.log('item', item)
  }, [])
  const handleDeleteHistory = useCallback((item: LLMHistory) => {
    deleteHistory(item)
  }, [deleteHistory])
  return (
    <Modal title="历史记录" open={isModalOpen} footer={<></>} onCancel={onClose} >
      {
        groupHistoryByTime().map((group) => (
          <div key={group.label}>
            <div className="text-sm font-bold mb-2">{group.label}</div>
            {group.items.map((item) => (
              <div className={
                `flex items-center justify-between text-base p-2 pt-1 pb-1 mb-1 rounded-lg 
                hover:bg-[var(--ant-color-bg-text-hover)]
                ${(history && history.id === item.id) ? 'bg-[var(--ant-color-bg-text-hover)]' : ''}
                cursor-pointer group`
              }
                key={item.id}
              >
                <div className="flex-1 truncate" onClick={() => handleSelectHistory(item.id)}>{item.title}</div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditHistory(item)} />
                  <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteHistory(item)} />
                </div>
              </div>
            ))}
          </div>
        ))
      }
    </Modal>
  )
}