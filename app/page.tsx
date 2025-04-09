"use client"

import React, { Suspense } from 'react';
import HomeContent from '@/app/home/page';

// 预加载其他路由组件
const ReadContent = React.lazy(() => import('@/app/read/page'));
const SettingContent = React.lazy(() => import('@/app/setting/page'));

export default function Home() {
  return (
    <>
      <HomeContent />
      <Suspense fallback={null}>
        <div style={{ display: 'none' }}>
          <ReadContent />
          <SettingContent />
        </div>
      </Suspense>
    </>
  );
}
