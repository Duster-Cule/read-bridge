'use client'

import { Menu, Button } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { Book } from '@/app/types/book'
import { useSiderStore } from '@/app/store/useSiderStore'
interface ReadMenuProps {
  toc: Book['toc']
  currentChapter: number
  onChapterChange: (index: number) => void
}

export default function ReadMenu({ toc, currentChapter, onChapterChange }: ReadMenuProps) {
  const { collapsed, setCollapsed } = useSiderStore()

  const toggleCollapsed = () => {
    setCollapsed(!collapsed)
  }
  const menuItems = toc.map(({ title, index }) => ({
    key: index,
    label: collapsed ? index + 1 : title,
    title: title
  }))

  return (
    <div className="flex flex-col h-full min-w-[80px]">
      <Button
        type="text"
        onClick={toggleCollapsed}
        className="mb-2 self-start"
      >
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </Button>
      <Menu
        mode="inline"
        selectedKeys={[String(currentChapter)]}
        inlineCollapsed={collapsed}
        items={menuItems}
        onClick={({ key }) => onChapterChange(parseInt(key))}
        className="flex-1 overflow-auto"
      />
    </div>
  )
}