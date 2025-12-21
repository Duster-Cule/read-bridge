export type ContextMenuItem = {
  id: string
  name: string
  prompt: string
  modelId: string | null // 使用的模型ID，null表示使用默认聊天模型
  enabled: boolean
}

export type ContextMenuPosition = {
  x: number
  y: number
}
