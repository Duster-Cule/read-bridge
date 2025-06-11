import { theme } from 'antd'

interface KeyboardShortcutProps {
  shortcut: string
  className?: string
}

export default function KeyboardShortcut({ shortcut, className = '' }: KeyboardShortcutProps) {
  const keys = shortcut.split('+').map(key => key.trim())
  const { token } = theme.useToken()

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {keys.map((key, index) => (
        <kbd
          key={index}
          className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-mono font-medium 
                     rounded shadow-sm"
          style={{
            backgroundColor: token.colorBgContainer,
            borderColor: token.colorBorder,
            color: token.colorText,
            border: `1px solid ${token.colorBorder}`
          }}
        >
          {key}
        </kbd>
      ))}
    </span>
  )
} 