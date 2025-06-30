'use client'

import { Menu, Button, List, Empty } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined, BookOutlined, DeleteOutlined } from '@ant-design/icons'
import { Book, Bookmark } from '@/types/book'
import { useSiderStore } from '@/store/useSiderStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useBook } from '@/hooks/useBook'
import { useState } from 'react'

interface ReadMenuProps {
  toc: Book['toc']
  currentChapter: number
  onChapterChange: (index: number, lineIndex: number) => void
}

// 渲染目录菜单函数
const renderTocMenu = (
  toc: Book['toc'],
  currentChapter: number,
  onChapterChange: (index: number, lineIndex: number) => void,
  collapsed: boolean
) => {
  const menuItems = toc.map(({ title, index }) => ({
    key: index,
    label: collapsed ? index + 1 : title,
    title: title
  }))

  return (
    <Menu
      mode="inline"
      selectedKeys={[String(currentChapter)]}
      inlineCollapsed={collapsed}
      items={menuItems}
      onClick={({ key }) => onChapterChange(parseInt(key), 0)}
      className="flex-1 overflow-auto"
    />
  )
}

// 渲染书签列表函数
const renderBookmarkList = (
  bookmarks: Bookmark[],
  handleBookmarkClick: (bookmark: Bookmark) => void,
  handleDeleteBookmark: (e: React.MouseEvent, bookmark: Bookmark) => void
) => {
  return (
    <div className="flex-1 overflow-auto">
      {bookmarks.length > 0 ? (
        <List
          size="small"
          dataSource={bookmarks}
          renderItem={(bookmark) => (
            <List.Item
              onClick={() => handleBookmarkClick(bookmark)}
              actions={[
                <DeleteOutlined
                  key="delete"
                  className="text-red-500 hover:text-red-700"
                  onClick={(e) => handleDeleteBookmark(e, bookmark)}
                />
              ]}
            >
              <List.Item.Meta
                title={
                  <div className="text-sm font-medium truncate">
                    {bookmark.sentence.length > 40
                      ? bookmark.sentence.substring(0, 40) + '...'
                      : bookmark.sentence}
                  </div>
                }
                description={
                  <div className="text-xs text-gray-500">
                    第{bookmark.chapterIndex + 1}章 · {bookmark.createTime}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty
          description="暂无书签"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className="mt-8"
        />
      )}
    </div>
  )
}

export default function ReadMenu({ toc, currentChapter, onChapterChange }: ReadMenuProps) {
  const { collapsed, setCollapsed, readingId } = useSiderStore()
  const { getBookmarksByBookId, removeBookmark } = useBookmarkStore()
  const [book] = useBook()
  const [mode, setMode] = useState<'toc' | 'bookmark'>('toc')

  // 获取当前书籍的书签
  const bookmarks = book ? getBookmarksByBookId(book.id) : []

  // 处理书签点击跳转
  const handleBookmarkClick = async (bookmark: Bookmark) => {
    if (!readingId) return
    try {
      await onChapterChange(bookmark.chapterIndex, bookmark.lineIndex)
      // 跳转后切换回目录模式
      setMode('toc')
    } catch (error) {
      console.error('跳转书签失败:', error)
    }
  }

  // 处理删除书签
  const handleDeleteBookmark = (e: React.MouseEvent, bookmark: Bookmark) => {
    e.stopPropagation() // 阻止事件冒泡，避免触发跳转
    if (!book) return
    removeBookmark(book.id, bookmark.id)
  }

  const switchToToc = () => {
    if (mode === 'toc') {
      setCollapsed(!collapsed)
    } else {
      setMode('toc')
    }
  }

  const switchToBookmark = () => {
    setMode('bookmark')
  }

  const getWidth = () => {
    if (mode === 'bookmark') return 'w-[200px]'
    return collapsed ? 'w-[80px]' : 'w-[200px]'
  }

  return (
    <div className={`flex flex-col h-full transition-all duration-300 ease-in-out ${getWidth()}`}>
      <div className="flex mb-2">
        <Button
          type="text"
          onClick={switchToToc}
          className="mr-1"
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </Button>
        <Button
          type="text"
          onClick={switchToBookmark}
        >
          <BookOutlined />
        </Button>
      </div>

      {mode === 'toc'
        ? renderTocMenu(toc, currentChapter, onChapterChange, collapsed)
        : renderBookmarkList(bookmarks, handleBookmarkClick, handleDeleteBookmark)}
    </div>
  )
}