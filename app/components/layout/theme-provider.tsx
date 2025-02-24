'use client';

import { ConfigProvider, theme } from 'antd';
import { useThemeStore } from '@/store/useThemeStore';
import { useEffect, useState } from 'react';


export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const { theme: currentTheme } = useThemeStore();

  useEffect(() => {
    Promise.resolve(useThemeStore.persist.rehydrate()).then(() => {
      setIsHydrated(true);
    });
  }, []);

  if (!isHydrated) {
    return null; // 或者返回一个加载状态
  }

  return (
    <ConfigProvider
      theme={{
        cssVar: true,
        algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
} 