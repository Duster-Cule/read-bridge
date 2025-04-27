import { useHistoryStore } from "@/store/useHistoryStore";
import { Button, Modal } from "antd";

type ChatHistory = {
  isModalOpen: boolean
  onClose: () => void
}

export default function ChatHistory({ isModalOpen, onClose }: ChatHistory) {
  const { groupHistoryByTime } = useHistoryStore()
  return (
    <Modal title="历史记录" open={isModalOpen} footer={<></>} onCancel={onClose} >
      {
        groupHistoryByTime().map((group) => (
          <div key={group.label}>
            <div className="text-sm font-bold">{group.label}</div>
            {group.items.map((item) => (
              <Button key={item.id} onClick={() => {
                onClose()
              }}>{item.title}</Button>
            ))}
          </div>
        ))
      }
    </Modal>
  )
}