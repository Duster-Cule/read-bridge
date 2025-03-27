import { useState } from "react"
import { EventEmitter, EVENT_NAMES } from "@/services/EventService"
import { Button, Input } from "antd"

export default function StandardChat() {
  const [message, setMessages] = useState<string>('')
  const onClickBtn = () => {
    console.log('btn click')
    EventEmitter.emit(EVENT_NAMES.SEND_MESSAGE, message)
  }

  return <div>
    <Input onChange={(e) => setMessages(e.target.value)} />
    <Button onClick={onClickBtn}>发送事件</Button>
  </div>
}

