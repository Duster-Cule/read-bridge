"use client"

import { Layout } from "antd";
import HeaderContent from "@/app/components/header";
import FooterContent from "@/app/components/footer";
import Sider from "@/app/components/sider";
import SelectionContextMenu from "@/app/components/SelectionContextMenu";
import { CSSProperties, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useHeaderStore();
  const { token } = theme.useToken();
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [selectedContext, setSelectedContext] = useState('');
  const [isPdfContext, setIsPdfContext] = useState(false);

  useEffect(() => {
    if (pathname === '/login') return

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

        const normalizeSpace = (s: string) => {
          const raw = String(s || '')
            // PDF text layers may contain soft-hyphen and zero-width characters.
            .replace(/\u00AD/g, '')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')

          try {
            return raw.normalize('NFKC').replace(/\s+/g, ' ').trim()
          } catch {
            return raw.replace(/\s+/g, ' ').trim()
          }
        }

        const buildPdfContextFromTextLayer = (textLayer: HTMLElement, range: Range) => {
          const allSpans = Array.from(textLayer.querySelectorAll('span')) as HTMLElement[]
          const spans = allSpans.filter((s) => (s.textContent || '').trim().length > 0)
          if (spans.length === 0) return ''

          const tryFindSpanIndex = (node: Node | null) => {
            if (!node) return -1
            const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
            const span = el?.closest?.('span') as HTMLElement | null
            if (!span) return -1
            return spans.indexOf(span)
          }

          let minIdx = Number.POSITIVE_INFINITY
          let maxIdx = -1
          for (let i = 0; i < spans.length; i++) {
            const span = spans[i]
            try {
              if (range.intersectsNode(span)) {
                minIdx = Math.min(minIdx, i)
                maxIdx = Math.max(maxIdx, i)
              }
            } catch {
              // Some browsers can throw if the node is not in the same tree; ignore.
            }
          }

          if (!Number.isFinite(minIdx) || minIdx === Number.POSITIVE_INFINITY) {
            const startIdx = tryFindSpanIndex(range.startContainer)
            const endIdx = tryFindSpanIndex(range.endContainer)
            if (startIdx >= 0) {
              minIdx = startIdx
              maxIdx = Math.max(startIdx, endIdx)
            }
          }

          if (!Number.isFinite(minIdx) || minIdx === Number.POSITIVE_INFINITY || maxIdx < 0) return ''

          const windowBefore = 40
          const windowAfter = 40
          const start = Math.max(0, (minIdx as number) - windowBefore)
          const end = Math.min(spans.length, (maxIdx as number) + windowAfter + 1)

          const parts = spans.slice(start, end).map((s) => s.textContent || '')
          const joined = normalizeSpace(parts.join(' '))
          if (!joined) return ''

          // Keep it within a reasonable size and centered around the selection.
          const preParts = spans.slice(start, Math.min(spans.length, (minIdx as number))).map((s) => s.textContent || '')
          const approxCenter = normalizeSpace(preParts.join(' ')).length
          if (joined.length <= 2000) return joined

          const winStart = Math.max(0, approxCenter - 800)
          const winEnd = Math.min(joined.length, approxCenter + 1200)
          return joined.slice(winStart, winEnd).trim().slice(0, 2000)
        }

        const findClosestOccurrenceIndex = (haystack: string, needle: string, hintIndex: number) => {
          if (!haystack || !needle) return -1
          let bestIdx = -1
          let bestDist = Number.POSITIVE_INFINITY
          let fromIndex = 0
          while (true) {
            const idx = haystack.indexOf(needle, fromIndex)
            if (idx < 0) break
            const dist = Math.abs(idx - hintIndex)
            if (dist < bestDist) {
              bestDist = dist
              bestIdx = idx
              if (bestDist === 0) break
            }
            fromIndex = idx + Math.max(1, needle.length)
          }
          return bestIdx
        }

        const pickContextBySentenceWindow = (sourceText: string, selectionText: string, hintIndex?: number) => {
          const source = normalizeSpace(sourceText)
          const sel = normalizeSpace(selectionText)
          if (!source) return ''

          const idx = sel
            ? (typeof hintIndex === 'number' && hintIndex >= 0
              ? findClosestOccurrenceIndex(source, sel, hintIndex)
              : source.indexOf(sel))
            : -1
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

            const pageText = textLayer?.innerText || textLayer?.textContent || ''

            // Prefer span-neighborhood context: this is stable across prod/standalone and
            // guarantees the selected region is inside the extracted context.
            const spanContext = textLayer ? buildPdfContextFromTextLayer(textLayer, range) : ''

            let hintIndex: number | undefined
            if (textLayer) {
              try {
                const preRange = document.createRange()
                preRange.selectNodeContents(textLayer)
                preRange.setEnd(range.startContainer, range.startOffset)
                hintIndex = normalizeSpace(preRange.toString()).length
              } catch {
                // ignore and fallback to first match
              }
            }

            const primarySource = spanContext || pageText
            context = spanContext
              ? pickContextBySentenceWindow(primarySource, text)
              : pickContextBySentenceWindow(primarySource, text, hintIndex)

            // Last-resort guard: ensure context is local even if matching fails.
            const normSel = normalizeSpace(text)
            const normCtx = normalizeSpace(context)
            if (normSel && normCtx && !normCtx.includes(normSel) && spanContext) {
              context = spanContext
            }
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
  }, [pathname]);

  if (pathname === '/login') {
    return <div className="min-h-screen w-full">{children}</div>
  }

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
