import { useTheme } from "next-themes"
import { useSiderStore } from "@/store/useSiderStore"

import { LLMHistory } from "@/types/llm";
import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { Button, message, Collapse } from "antd"
import dayjs from 'dayjs'

import { SyncOutlined } from "@ant-design/icons"
import { CopyIcon } from "@/assets/icon"

export default function ChatContent({ history, containerRef }: { history: LLMHistory, containerRef: RefObject<HTMLDivElement> }) {
  const [height, setHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const height = containerRef.current.getBoundingClientRect().height;
    setHeight(height - 142);
  }, [containerRef]);

  useEffect(() => {
    if (!contentRef.current) return;

    const observer = new MutationObserver(() => {
      if (!contentRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (isNearBottom) {
        contentRef.current.scrollTo({
          top: contentRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
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
       p-2  text-ellipsis mb-2 border border-[var(--ant-color-border)]">{history.prompt}</div>
      {history.messages.map((msg, index) => {
        if (msg.role === 'user') {
          return <MessageBubble key={index} msg={msg} isUser={true} />
        } else {
          return <MessageBubble key={index} msg={msg} isUser={false} />
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
  const { thinkingExpanded, setThinkingExpanded } = useSiderStore()
  const [activeKey, setActiveKey] = useState<string | string[]>(thinkingExpanded ? ['thinking'] : [])

  const commonClasses = useMemo(() => {
    return {
      container: "flex flex-row mb-3 items-start" + (isUser ? ' justify-end' : ' justify-start'),
      bubbleWrapper: (isUser ? ' ml-auto max-w-[90%]' : ' mr-auto w-[90%]'),
      timestampWrapper: "flex mb-1" + (isUser ? ' justify-end' : ' justify-start'),
      bubble: "p-2 rounded-md border border-[var(--ant-color-border)] text-sm" +
        (isUser
          ? isDarkMode ? ' bg-blue-300/40' : ' bg-blue-100'
          : isDarkMode ? ' bg-gray-800' : ' bg-gray-100 '),
      actionsWrapper: "flex mt-1 space-x-2" + (isUser ? ' justify-end' : ' justify-start'),
      name: "text-xs font-semibold",
      timestamp: "text-xs text-gray-500 ml-2",
      collapsePanel: isDarkMode
        ? "bg-gray-700 border-gray-600"
        : "bg-gray-50 border-gray-200",
    };
  }, [isUser, isDarkMode])

  // Handle collapse change and update the store
  const handleCollapseChange = (key: string | string[]) => {
    setActiveKey(key);
    // Only update the store if this is an assistant message
    if (!isUser) {
      const isExpanded = Array.isArray(key) ? key.includes('thinking') : key === 'thinking';
      setThinkingExpanded(isExpanded);
    }
  };

  // Don't show the collapse panel for user messages
  if (isUser) {
    return (
      <div className={commonClasses.container}>
        <div className={commonClasses.bubbleWrapper}>
          <div className={commonClasses.timestampWrapper}>
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

  const hasThinkingContent = !!msg.reasoningContent;
  const isThinking = hasThinkingContent && !msg.thinkingTime;
  const thinkingLabel = isThinking
    ? '思考中...'
    : `思考完成 (用时${msg.thinkingTime}秒)`;

  return (
    <div className={commonClasses.container}>
      <div className={commonClasses.bubbleWrapper}>
        <div className={commonClasses.timestampWrapper}>
          <span className={commonClasses.name}>{msg.name}</span>
          <span className={commonClasses.timestamp}>
            {dayjs(msg.timestamp).format('MM-DD HH:mm')}
          </span>
        </div>
        <div className={commonClasses.bubble}>
          {hasThinkingContent && (
            <Collapse
              activeKey={activeKey}
              onChange={handleCollapseChange}
              bordered={false}
              className={`mb-4 overflow-hidden ${commonClasses.collapsePanel}`}
              items={[
                {
                  key: 'thinking',
                  label: (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        {isThinking && <SyncOutlined spin className="mr-1 text-blue-500" />}
                        <span >
                          {thinkingLabel}
                        </span>
                      </div>
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(msg.reasoningContent || '');
                          message.success('思考内容已复制');
                        }}
                      />
                    </div>
                  ),
                  children: (
                    <div >
                      {msg.reasoningContent}
                    </div>
                  )
                }
              ]}
            />
          )}
          <div>{msg.content}</div>
        </div>
        <div className={commonClasses.actionsWrapper}>
          <Button
            type="text"
            size="small"
            icon={<CopyIcon />}
            onClick={() => {
              navigator.clipboard.writeText(msg.content)
              message.success('回复已复制')
            }}
          />
        </div>
      </div>
    </div>
  )
}