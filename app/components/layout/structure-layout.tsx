"use client"

import { Layout } from "antd";
import HeaderContent from "@/app/components/header";
import FooterContent from "@/app/components/footer";
import Sider from "@/app/components/sider";
import SelectionContextMenu from "@/app/components/SelectionContextMenu";
import { CSSProperties, useState, useEffect } from "react";
import { useHeaderStore } from "@/store/useHeaderStore";
import { Button } from "antd";
import { CaretDownFilled } from "@ant-design/icons";
import { theme } from "antd";
import Preload from "@/app/components/preload";
import { EventEmitter, EVENT_NAMES } from "@/services/EventService";
import { normalizeDictQuery } from "@/utils/dictQuery";

const { Header, Content, Footer } = Layout;

const layoutStyle: CSSProperties = {
  height: '100vh',
  width: '100%',
  maxWidth: '1920px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
};

// Dynamic header style will be used instead of this static one
const headerStyle: CSSProperties = {
  height: 'auto',
  lineHeight: '64px',
  position: 'sticky',
  top: 0,
  zIndex: 1,
  padding: 0,
  width: '100%',
  transition: 'all 0.3s ease-in-out',
  overflow: 'hidden',
};

const contentStyle: CSSProperties = {
  flex: 1,
  overflow: 'auto',
};

const footerStyle: CSSProperties = {
  position: 'sticky',
  bottom: 0,
  padding: '0',
  width: '100%',
  height: '28px',
};

const headerToggleButtonStyle: CSSProperties = {
  position: 'fixed',
  top: '-8px',
  right: '40px',
  zIndex: 2,
  opacity: 1,
  transition: 'all 0.3s ease-in-out',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  width: '32px',
  height: '28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transform: 'translateY(0)',
  cursor: 'pointer',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { collapsed, toggleCollapsed } = useHeaderStore();
  const { token } = theme.useToken();
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [selectedContext, setSelectedContext] = useState('');
  const [isPdfContext, setIsPdfContext] = useState(false);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 0 && selection) {
        e.preventDefault();
        setSelectedText(text);

        // 判断是否在 PDF 查看器内触发
        const nodeToCheck = selection.anchorNode || selection.focusNode
        const elToCheck = (nodeToCheck && (nodeToCheck as any).nodeType === Node.ELEMENT_NODE)
          ? (nodeToCheck as Element)
          : (nodeToCheck ? (nodeToCheck as any).parentElement : null)
        const pdfRoot = elToCheck?.closest?.('[data-reader-mode="pdf"]') as HTMLElement | null
        const isPdf = Boolean(pdfRoot)
        setIsPdfContext(isPdf)

        const normalizeSpace = (s: string) => String(s || '').replace(/\s+/g, ' ').trim()

        const pickContextBySentenceWindow = (sourceText: string, selectionText: string) => {
          const source = normalizeSpace(sourceText)
          const sel = normalizeSpace(selectionText)
          if (!source) return ''

          const idx = sel ? source.indexOf(sel) : -1
          if (idx < 0) {
            return source.slice(0, 2000)
          }

          const startSearch = idx
          const endSearch = idx + sel.length
          const isBoundary = (ch: string) => /[。！？.!?；;\n]/.test(ch)

          const findPrevBoundary = (pos: number, count: number) => {
            let found = 0
            for (let i = pos - 1; i >= 0; i--) {
              if (isBoundary(source[i])) {
                found++
                if (found >= count) return i + 1
              }
            }
            return 0
          }

          const findNextBoundary = (pos: number, count: number) => {
            let found = 0
            for (let i = pos; i < source.length; i++) {
              if (isBoundary(source[i])) {
                found++
                if (found >= count) return i + 1
              }
            }
            return source.length
          }

          const start = findPrevBoundary(startSearch, 2) // include previous sentence if possible
          const end = findNextBoundary(endSearch, 2) // include next sentence if possible
          return source.slice(start, end).trim().slice(0, 2000)
        }
        
        // 获取上下文（段落）
        let context = '';
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);

          if (isPdf) {
            // PDF text layer spans are absolutely positioned; our generic "block" heuristic often
            // fails and returns only a short fragment. For PDF, use the whole page text layer.
            const pageEl = elToCheck?.closest?.('.react-pdf__Page') as HTMLElement | null
            const textLayer = (pageEl?.querySelector('.textLayer') as HTMLElement | null)
              || (pageEl?.querySelector('.react-pdf__Page__textContent') as HTMLElement | null)

            const pageText = textLayer?.textContent || textLayer?.innerText || ''
            context = pickContextBySentenceWindow(pageText, text)
          } else {
          
          // 辅助函数：找到包含文本的块级元素
          const getBlockParent = (node: Node | null): HTMLElement | null => {
            let current = node;
            while (current && current !== document.body) {
              if (current.nodeType === Node.ELEMENT_NODE) {
                const el = current as HTMLElement;
                // 针对 ReadArea 的特殊处理
                if (el.classList.contains('leading-relaxed')) {
                  return el;
                }
                
                const display = window.getComputedStyle(el).display;
                if (display === 'block' || display === 'flex' || display === 'grid' || el.tagName === 'P') {
                  // 简单的启发式：如果包含文本节点，可能是我们想要的段落
                  if (Array.from(el.childNodes).some(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())) {
                    return el;
                  }
                }
              }
              current = current.parentNode;
            }
            return null;
          };

          const blocks = new Set<HTMLElement>();
          
          // 使用 TreeWalker 遍历 range 内的所有文本节点，找到它们的父块
          const walker = document.createTreeWalker(
            range.commonAncestorContainer,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
                if (range.intersectsNode(node)) {
                  return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
              }
            }
          );

          let currentNode = walker.nextNode();
          // 如果没有找到节点（例如选中在同一个文本节点内），手动添加
          if (!currentNode && range.startContainer.nodeType === Node.TEXT_NODE) {
             const block = getBlockParent(range.startContainer);
             if (block) blocks.add(block);
          } else {
             while (currentNode) {
               const block = getBlockParent(currentNode);
               if (block) blocks.add(block);
               currentNode = walker.nextNode();
             }
          }
          
          context = Array.from(blocks).map(el => el.innerText).join('\n');
          }
        }
        
        setSelectedContext(context || text); // 如果没找到上下文，回退到选中文本
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setContextMenuVisible(true);
      }
    };

    const isInteractiveElement = (el: Element | null) => {
      if (!el) return false;
      return Boolean(
        el.closest(
          'input, textarea, select, button, [role="button"], [contenteditable="true"]'
        )
      );
    };

    const extractWordFromPoint = (x: number, y: number) => {
      const doc = document as unknown as {
        caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
        caretRangeFromPoint?: (x: number, y: number) => Range | null;
      };

      let container: Node | null = null;
      let offset = 0;

      if (typeof doc.caretPositionFromPoint === 'function') {
        const pos = doc.caretPositionFromPoint(x, y);
        if (pos) {
          container = pos.offsetNode;
          offset = pos.offset;
        }
      } else if (typeof doc.caretRangeFromPoint === 'function') {
        const range = doc.caretRangeFromPoint(x, y);
        if (range) {
          container = range.startContainer;
          offset = range.startOffset;
        }
      }

      if (!container) return '';

      const getFirstTextNode = (node: Node | null): Text | null => {
        if (!node) return null;
        if (node.nodeType === Node.TEXT_NODE) return node as Text;
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        return walker.nextNode() as Text | null;
      };

      let textNode: Text | null = null;
      let textOffset = offset;
      if (container.nodeType === Node.TEXT_NODE) {
        textNode = container as Text;
      } else if (container.nodeType === Node.ELEMENT_NODE) {
        const el = container as Element;
        const child = el.childNodes.item(Math.min(offset, Math.max(0, el.childNodes.length - 1)));
        textNode = getFirstTextNode(child) ?? getFirstTextNode(container);
        textOffset = 0;
      } else {
        return '';
      }

      const text = textNode?.data ?? '';
      if (!text) return '';

      // Clamp offset to [0, text.length]
      const pos = Math.max(0, Math.min(textOffset, text.length));

      const isWordChar = (ch: string) => /[A-Za-z0-9'’\-]/.test(ch);
      let start = pos;
      let end = pos;

      while (start > 0 && isWordChar(text[start - 1])) start--;
      while (end < text.length && isWordChar(text[end])) end++;

      return text.slice(start, end);
    };

    const handleAltClick = (e: MouseEvent) => {
      // Alt + left click: quick dictionary lookup
      if (!e.altKey || e.button !== 0) return;

      const target = e.target instanceof Element ? e.target : null;
      // Only enable this shortcut inside the reader area (text reader or PDF viewer).
      const inTextReader = Boolean(target?.closest('.leading-relaxed'));
      const inPdfReader = Boolean(target?.closest('[data-reader-mode="pdf"]'));
      if (!inTextReader && !inPdfReader) return;
      if (isInteractiveElement(target)) return;

      const selection = window.getSelection();
      const selected = selection?.toString().trim() ?? '';
      const fromSelection = normalizeDictQuery(selected);
      const fromPoint = fromSelection ? '' : normalizeDictQuery(extractWordFromPoint(e.clientX, e.clientY));

      const query = fromSelection || fromPoint;
      if (!query) return;

      // Prevent default click behavior (e.g. text selection quirks) and trigger lookup.
      e.preventDefault();
      e.stopPropagation();
      EventEmitter.emit(EVENT_NAMES.HANDLE_DICT_QUERY, query);
    };

    const handleClick = () => {
      setContextMenuVisible(false);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleAltClick, true);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleAltClick, true);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // Dynamic header height based on collapsed state
  const dynamicHeaderStyle: CSSProperties = {
    ...headerStyle,
    height: collapsed ? '0' : '64px',
    opacity: collapsed ? 0 : 1,
    pointerEvents: collapsed ? 'none' : 'auto',
  };

  // Dynamic toggle button style
  const dynamicToggleButtonStyle: CSSProperties = {
    ...headerToggleButtonStyle,
    opacity: collapsed ? 1 : 0,
    transform: collapsed ? 'translateY(0)' : 'translateY(-100%)',
    pointerEvents: collapsed ? 'auto' : 'none',
    backgroundColor: token.colorBgContainer,
    color: token.colorText,
    border: `1px solid ${token.colorBorder}`,
  };

  const iconStyle: CSSProperties = {
    fontSize: 16,
    transition: 'transform 0.3s ease',
  };

  return (
    <Layout style={layoutStyle}>
      <Preload />
      <Header style={dynamicHeaderStyle}><HeaderContent /></Header>
      {collapsed && (
        <Button
          type="text"
          icon={<CaretDownFilled style={iconStyle} className="transform translate-y-[4px]" />}
          style={dynamicToggleButtonStyle}
          onClick={toggleCollapsed}
          className="transition-all duration-300"
        />
      )}
      <div className="flex flex-1 overflow-hidden flex-row">
        <Content style={{ ...contentStyle }}>
          {children}
        </Content>
        <Sider />
      </div>
      <Footer style={footerStyle}><FooterContent /></Footer>
      <SelectionContextMenu
        visible={contextMenuVisible}
        position={contextMenuPosition}
        selectedText={selectedText}
        selectedContext={selectedContext}
        isPdfMode={isPdfContext}
        onClose={() => setContextMenuVisible(false)}
      />
    </Layout>
  );
}