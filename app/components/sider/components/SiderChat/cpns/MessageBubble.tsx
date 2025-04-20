import { LLMHistory } from "@/types/llm";
import { memo, useCallback, useMemo, useState } from "react";
import { Button, Collapse, message } from "antd";
import dayjs from "dayjs";
import { useTheme } from "next-themes"
import { SyncOutlined, LoadingOutlined } from "@ant-design/icons";
import { CopyIcon } from "@/assets/icon";
import { useSiderStore } from "@/store/useSiderStore";

const MessageBubble = memo(function MessageBubble({
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

  const handleCollapseChange = useCallback((key: string | string[], isUser: boolean) => {
    setActiveKey(key);
    if (!isUser) {
      const isExpanded = Array.isArray(key) ? key.includes('thinking') : key === 'thinking';
      setThinkingExpanded(isExpanded);
    }
  }, [setThinkingExpanded])

  const hasThinkingContent = !isUser && !!msg.reasoningContent;
  const isThinking = hasThinkingContent && !msg.thinkingTime;
  const thinkingLabel = isThinking
    ? '思考中...'
    : `思考完成 (用时${msg.thinkingTime}秒)`;

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
          {hasThinkingContent && (
            <Collapse
              activeKey={activeKey}
              onChange={key => handleCollapseChange(key, isUser)}
              bordered={false}
              className={`mb-4 overflow-hidden ${commonClasses.collapsePanel}`}
              items={[
                {
                  key: 'thinking',
                  label: (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        {isThinking && <SyncOutlined spin className="mr-1 text-blue-500" />}
                        <span>
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
                    <div>
                      {msg.reasoningContent}
                    </div>
                  )
                }
              ]}
            />
          )}
          <div>
            {msg.content.length === 0 ? (
              <LoadingOutlined />
            ) : (
              msg.content
            )}
          </div>
        </div>
        <div className={commonClasses.actionsWrapper}>
          <Button
            type="text"
            size="small"
            icon={<CopyIcon />}
            onClick={() => {
              navigator.clipboard.writeText(msg.content)
              message.success(isUser ? 'Copied to clipboard' : '回复已复制')
            }}
          />
        </div>
      </div>
    </div>
  )
})
MessageBubble.displayName = 'MessageBubble'
export default MessageBubble