import { useEffect, useMemo, useRef, useState } from "react"
import Vditor from "vditor"
import { useTheme } from 'next-themes'
import { Spin } from "antd"
import { LoadingOutlined } from '@ant-design/icons'
import './index.css'
interface MarkdownViewerProps {
  content: string
  minHeight?: number
  className?: string
}

export default function MarkdownViewer({
  content,
  minHeight = 262,
  className = "w-full overflow-y-auto"
}: MarkdownViewerProps) {
  const isLoading = useMemo(() => {
    return !content
  }, [content])

  const previewRef = useRef<HTMLDivElement>(null)
  const vditorRef = useRef<Vditor | null>(null)
  const [vditorReady, setVditorReady] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    if (previewRef.current) {
      const vditor = new Vditor(previewRef.current, {
        cache: {
          id: "vditor-markdown-viewer"
        },
        minHeight,

        theme: theme === 'dark' ? 'dark' : 'classic',
        preview: {
          theme: {
            current: theme === 'dark' ? 'dark' : 'light',
          },
          hljs: {
            style: theme === 'dark' ? 'github-dark' : 'github',
          },
        },
        toolbar: ['edit-mode', 'fullscreen', {
          name: "more",
          toolbar: [
            "both",
            "code-theme",
            "content-theme",
            "export",
            "outline",
            "preview",
            "devtools",
            "info",
            "help",
          ],
        },],
        after: () => {
          setVditorReady(true);
        },
      });
      vditorRef.current = vditor
      return () => {
        setVditorReady(false);
        try {
          if (vditor && typeof vditor.destroy === 'function') {
            vditor.destroy();
          }
        } catch { }
        vditorRef.current = null
      };
    }
  }, [previewRef, theme, minHeight]);

  useEffect(() => {
    if (!vditorReady || !vditorRef.current || !previewRef.current || typeof vditorRef.current.setValue !== 'function') return
    try {
      vditorRef.current.setValue(content)
    } catch {
      console.error('Error setting Vditor value');
    }
  }, [content, vditorReady]);

  // 监听主题变化并更新编辑器主题
  useEffect(() => {
    if (!vditorReady || !vditorRef.current) return
    try {
      vditorRef.current.setTheme(
        theme === 'dark' ? 'dark' : 'classic',
        theme === 'dark' ? 'dark' : 'light',
        theme === 'dark' ? 'github-dark' : 'github'
      )
    } catch { }
  }, [theme, vditorReady]);

  return (
    <Spin spinning={isLoading} indicator={<LoadingOutlined spin />}>
      <div className={`${className} h-[${minHeight}px]`}>
        <div ref={previewRef} />
      </div>
    </Spin>
  )
}

MarkdownViewer.displayName = 'MarkdownViewer'; 