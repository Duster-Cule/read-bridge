"use client"

import React, { useEffect } from 'react';
import HomeContent from '@/app/home/page';

export default function Home() {
  useEffect(() => {
    const timer = setTimeout(() => {
      // 预加载路由
      import('@/app/read/page');
      import('@/app/setting/page');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <HomeContent />
    </>
  );
}
