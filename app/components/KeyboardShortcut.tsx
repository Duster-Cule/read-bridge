interface KeyboardShortcutProps {
  shortcut: string
  className?: string
}

export default function KeyboardShortcut({ shortcut, className = '' }: KeyboardShortcutProps) {
  const keys = shortcut.split('+').map(key => key.trim())

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {keys.map((key, index) => (
        <kbd
          key={index}
          className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-mono font-medium 
                     bg-gray-100 border border-gray-300 rounded shadow-sm 
                     dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
        >
          {key}
        </kbd>
      ))}
    </span>
  )
} 