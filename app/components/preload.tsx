"use client"

import { useEffect } from 'react';

export default function Preload() {
  useEffect(() => {
    const timer = setTimeout(async () => {
      // 预加载路由
      console.log('preload')
      await import('@/app/setting/page');
      console.log('setting loaded')
      await import('@/app/read/page');
      console.log('read loaded')
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return null;
} 