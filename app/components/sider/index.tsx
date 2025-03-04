import { useState, useRef, useCallback, useEffect } from 'react';
import { useSiderStore } from '@/store/useSiderStore';
import { theme } from 'antd';

import StandardChat from './components/StandardChat';

const MIN_WIDTH = 400;
const MAX_WIDTH = 600;

export default function Sider() {
  const { siderWidth, setSiderWidth } = useSiderStore();
  const [width, setWidth] = useState(siderWidth); // 默认宽度
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.userSelect = 'none'; // 防止拖拽时选中文本
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const diff = startX.current - e.clientX;
    const newWidth = Math.min(Math.max(startWidth.current + diff, MIN_WIDTH), MAX_WIDTH);
    setWidth(newWidth);
    setSiderWidth(newWidth);
    // make eslint happy
  }, [setWidth, setSiderWidth]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.userSelect = '';
  }, []);

  // 事件监听
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const { token } = theme.useToken();
  return (
    <div
      className="h-full relative ml-2 shadow-sm"
      style={{ width: `${width}px`, backgroundColor: token.colorBgContainer, borderLeft: `1px solid ${token.colorBorder}` }}
    >
      <div
        className="absolute left-[-4px] top-0 bottom-0 w-[8px] cursor-ew-resize hover:bg-blue-300 transition-colors"
        onMouseDown={handleMouseDown}
      />
      <SiderContent />
    </div>
  )
}

function SiderContent() {
  return (
    <div className="w-full h-full p-4 flex flex-col">
      <StandardChat />
    </div>
  )
}
