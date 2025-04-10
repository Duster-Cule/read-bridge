"use client"

import { useEffect } from 'react';

export default function Preload() {
  useEffect(() => {
    const timer = setTimeout(() => {
      // 预加载路由
      import('@/app/setting/page');
      import('@/app/read/page');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return null;
} 