import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ContextMenuItem } from '@/types/contextMenu'
import { generateUUID } from '@/utils/uuid'
import { createSettingsJSONStorage } from '@/store/persistStorage'

interface ContextMenuStore {
  items: ContextMenuItem[]
  addItem: () => void
  editItem: (item: ContextMenuItem) => void
  deleteItem: (id: string) => void
  toggleItem: (id: string) => void
  getEnabledItems: () => ContextMenuItem[]
}

const defaultItems = (): ContextMenuItem[] => [
  {
    id: generateUUID(),
    name: '解释',
    prompt: '请解释以下选中内容的含义（如果是单词请解释词义，如果是句子请解释句意）。\n\n选中内容：\n{{selection}}\n\n上下文：\n{{paragraph}}',
    modelId: null,
    enabled: true,
  },
  {
    id: generateUUID(),
    name: '翻译',
    prompt: '请将以下选中内容翻译成中文。\n\n选中内容：\n{{selection}}\n\n上下文：\n{{paragraph}}',
    modelId: null,
    enabled: true,
  },
  {
    id: generateUUID(),
    name: '语法分析',
    prompt: '请分析以下选中内容的语法结构。\n\n选中内容：\n{{selection}}\n\n上下文：\n{{paragraph}}',
    modelId: null,
    enabled: true,
  },
]

export const useContextMenuStore = create<ContextMenuStore>()(
  persist(
    (set, get) => ({
      items: defaultItems(),
      addItem: () => {
        const newItem: ContextMenuItem = {
          id: generateUUID(),
          name: '新菜单项',
          prompt: '{{selection}}',
          modelId: null,
          enabled: true,
        }
        set({ items: [...get().items, newItem] })
      },
      editItem: (item: ContextMenuItem) => {
        set({ items: get().items.map(i => i.id === item.id ? item : i) })
      },
      deleteItem: (id: string) => {
        set({ items: get().items.filter(i => i.id !== id) })
      },
      toggleItem: (id: string) => {
        set({ items: get().items.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i) })
      },
      getEnabledItems: () => {
        return get().items.filter(i => i.enabled)
      },
    }),
    {
      name: 'context-menu-storage',
      storage: createSettingsJSONStorage(),
    }
  )
)
