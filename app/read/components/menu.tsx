'use client'

import { Menu, Button } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined, BookOutlined } from '@ant-design/icons'
import { Book } from '@/types/book'
import { useSiderStore } from '@/store/useSiderStore'
import { useState } from 'react'

interface ReadMenuProps {
  toc: Book['toc']
  currentChapter: number
  onChapterChange: (index: number) => void
}

export default function ReadMenu({ toc, currentChapter, onChapterChange }: ReadMenuProps) {
  const { collapsed, setCollapsed } = useSiderStore()
  const [mode, setMode] = useState<'toc' | 'bookmark'>('toc')

  const toggleCollapsed = () => {
    setCollapsed(!collapsed)
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

  const menuItems = toc.map(({ title, index }) => ({
    key: index,
    label: collapsed ? index + 1 : title,
    title: title
  }))

  const getWidth = () => {
    if (mode === 'bookmark') return 'w-[220px]'
    return collapsed ? 'w-[80px]' : 'w-[220px]'
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

      {mode === 'toc' ? (
        <Menu
          mode="inline"
          selectedKeys={[String(currentChapter)]}
          inlineCollapsed={collapsed}
          items={menuItems}
          onClick={({ key }) => onChapterChange(parseInt(key))}
          className="flex-1 overflow-auto"
        />
      ) : (
        <div className="flex-1 overflow-auto w-[220px]">
          {/* 书签内容占位 */}
        </div>
      )}
    </div>
  )
}