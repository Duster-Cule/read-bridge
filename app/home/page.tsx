import { useEffect, useState } from "react";
import { EventEmitter, EVENT_NAMES } from "@/services/EventService";
export default function Home() {
  const [message, setMessages] = useState<string>('')
  useEffect(() => {
    console.log('home effect')
    const unsubscribe = EventEmitter.on(EVENT_NAMES.SEND_MESSAGE, (msg: string) => {
      console.log('got msg', msg)
      setMessages(msg)
    })
    return () => {
      unsubscribe()
    }
  }, [])
  return (
    <div>
      首页内容
      {message}
    </div>
  );
}
