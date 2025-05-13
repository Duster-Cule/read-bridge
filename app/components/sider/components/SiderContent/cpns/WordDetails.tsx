import { useEffect, useMemo, useRef, useState } from "react"
import Vditor from "vditor"
import { useTheme } from 'next-themes'
import { Spin } from "antd"
import { LoadingOutlined } from '@ant-design/icons'
export default function WordDetails({ wordDetails }: { wordDetails: string }) {
  const isLoading = useMemo(() => {
    return !wordDetails
  }, [wordDetails])

  const previewRef = useRef<HTMLDivElement>(null)
  const vditorRef = useRef<Vditor | null>(null)
  const [vditorReady, setVditorReady] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    if (previewRef.current) {
      const vditor = new Vditor(previewRef.current, {
        cache: {
          id: "vditor-word-details"
        },
        minHeight: 262,
        theme: theme === 'dark' ? 'dark' : 'classic',
        preview: {
          theme: {
            current: theme === 'dark' ? 'dark' : 'light',
          },
          hljs: {
            style: theme === 'dark' ? 'github-dark' : 'github',
          },
        },
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
  }, [previewRef, theme]);

  useEffect(() => {
    if (!vditorReady || !vditorRef.current || !previewRef.current || typeof vditorRef.current.setValue !== 'function') return
    try {
      vditorRef.current.setValue(wordDetails)
    } catch {
      console.error('Error setting Vditor value');
    }
  }, [wordDetails, vditorReady]);

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
      <div className="w-full h-[262px] overflow-y-auto">
        <div ref={previewRef} />
      </div>
    </Spin>
  )
}

WordDetails.displayName = 'WordDetails';