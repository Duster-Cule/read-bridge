"use client"

import { useEffect } from 'react';

export default function Preload() {
  useEffect(() => {
    const timer = setTimeout(async () => {
      // 预加载路由
      await import('@/app/setting/page');
      await import('@/app/read/page');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return null;
} 