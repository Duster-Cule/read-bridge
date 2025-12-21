import React, { useMemo, useCallback } from 'react'
import { Modal } from 'antd'
import { useContextMenuStore } from '@/store/useContextMenuStore'
import { useLLMStore } from '@/store/useLLMStore'
import { ContextMenuItem } from '@/types/contextMenu'
import { useTranslation } from '@/i18n/useTranslation'
import { EventEmitter, EVENT_NAMES } from '@/services/EventService'
import { normalizeDictQuery } from '@/utils/dictQuery'
import { useSiderStore } from '@/store/useSiderStore'

interface SelectionContextMenuProps {
  visible: boolean
  position: { x: number; y: number }
  selectedText: string
  selectedContext?: string
  isPdfMode?: boolean
  onClose: () => void
}

const SelectionContextMenu: React.FC<SelectionContextMenuProps> = ({
  visible,
  position,
  selectedText,
  selectedContext,
  isPdfMode = false,
  onClose,
}) => {
  const { t } = useTranslation()
  const items = useContextMenuStore(state => state.items)
  const enabledItems = useMemo(() => items.filter(i => i.enabled), [items])
  const { chatModel, models } = useLLMStore()
  const { readingId } = useSiderStore()

  const handleMenuClick = useCallback((item: ContextMenuItem) => {
    onClose() // 关闭右键菜单
    
    // 确定使用的模型
    const targetModel = item.modelId 
      ? models().find(m => m.id === item.modelId) 
      : chatModel

    if (!targetModel) {
      Modal.error({
        title: t('contextMenu.noModel'),
        content: t('contextMenu.pleaseSelectModel'),
      })
      return
    }

    // 发送事件给 Sider
    EventEmitter.emit(EVENT_NAMES.HANDLE_SELECTION_MENU, {
      text: selectedText,
      context: selectedContext || selectedText,
      menuItem: item,
      model: targetModel
    })

  }, [selectedText, selectedContext, chatModel, models, onClose, t])

  const handleDictClick = useCallback(() => {
    onClose()
    const query = normalizeDictQuery(selectedText)
    if (!query) return
    EventEmitter.emit(EVENT_NAMES.HANDLE_DICT_QUERY, query)
  }, [onClose, selectedText])

  const pickSentenceFromContext = useCallback((text: string, context?: string) => {
    const rawText = (text || '').trim()
    if (!rawText) return ''
    const rawContext = (context || '').trim()
    const normalizedText = rawText.replace(/\s+/g, ' ')
    const normalizedContext = rawContext.replace(/\s+/g, ' ')

    const source = normalizedContext || normalizedText
    const idx = normalizedContext ? normalizedContext.indexOf(normalizedText) : -1
    if (idx < 0) {
      // Fallback: try to take the first sentence-looking chunk from selection
      return normalizedText
    }

    const startSearch = idx
    const endSearch = idx + normalizedText.length

    const isBoundary = (ch: string) => /[。！？.!?；;\n]/.test(ch)

    let start = 0
    for (let i = startSearch - 1; i >= 0; i--) {
      if (isBoundary(source[i])) {
        start = i + 1
        break
      }
    }

    let end = source.length
    for (let i = endSearch; i < source.length; i++) {
      if (isBoundary(source[i])) {
        end = i + 1
        break
      }
    }

    const sentence = source.slice(start, end).trim()
    return sentence || normalizedText
  }, [])

  const handleSelectSentence = useCallback(() => {
    onClose()
    const sentence = pickSentenceFromContext(selectedText, selectedContext)
    if (!sentence) return
    if (!readingId) return
    EventEmitter.emit(EVENT_NAMES.SEND_SELECTED_SENTENCE, { text: sentence, bookId: readingId })
  }, [onClose, pickSentenceFromContext, readingId, selectedContext, selectedText])

  if (!visible || (!isPdfMode && enabledItems.length === 0)) return null

  return (
    <div
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
        onClick={handleDictClick}
      >
        {t('contextMenu.queryWord')}
      </div>

      {isPdfMode && (
        <div className="h-[1px] bg-gray-200 dark:bg-gray-700 my-1" />
      )}

      {isPdfMode && (
        <div
          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
          onClick={handleSelectSentence}
        >
          {t('contextMenu.selectSentence')}
        </div>
      )}

      {enabledItems.length > 0 && (
        <div className="h-[1px] bg-gray-200 dark:bg-gray-700 my-1" />
      )}
      {enabledItems.map((item) => (
        <div
          key={item.id}
          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
          onClick={() => handleMenuClick(item)}
        >
          {item.name}
        </div>
      ))}
    </div>
  )
}

export default SelectionContextMenu
