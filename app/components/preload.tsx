"use client"

import { useEffect } from 'react';
import { migrateBooksToBooksDir } from '@/utils/migrateBooksToBooksDir'

export default function Preload() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      ;(window as unknown as { migrateBooksToBooksDir?: typeof migrateBooksToBooksDir }).migrateBooksToBooksDir = migrateBooksToBooksDir
    }

    const timer = setTimeout(async () => {
      // 预加载路由
      await import('@/app/setting/page');
      await import('@/app/read/page');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return null;
} 