import { useHistoryStore } from "@/store/useHistoryStore";
import { Modal } from "antd";
import { useCallback } from "react";

type ChatHistory = {
  isModalOpen: boolean
  onClose: () => void
  onSelect: (id: string) => void
}

export default function ChatHistory({ isModalOpen, onClose, onSelect }: ChatHistory) {
  const { groupHistoryByTime, history } = useHistoryStore()
  const handleSelectHistory = useCallback((id: string) => {
    onSelect(id)
    onClose()
  }, [onSelect, onClose])
  return (
    <Modal title="历史记录" open={isModalOpen} footer={<></>} onCancel={onClose} >
      {
        groupHistoryByTime().map((group) => (
          <div key={group.label}>
            <div className="text-sm font-bold mb-2">{group.label}</div>
            {group.items.map((item) => (
              <div className={
                `text-base p-2 pt-1 pb-1 rounded-lg 
                hover:bg-[var(--ant-color-bg-text-hover)]
                ${(history && history.id === item.id) ? 'bg-[var(--ant-color-bg-text-hover)]' : ''}
                cursor-pointer`
              }
                key={item.id}
                onClick={() => handleSelectHistory(item.id)}
              >{item.title} </div>
            ))}
          </div>
        ))
      }
    </Modal>
  )
}