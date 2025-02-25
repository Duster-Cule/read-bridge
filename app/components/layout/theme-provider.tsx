'use client';

import { ConfigProvider, theme } from 'antd';
import { ThemeProvider as NextThemeProvider, useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

function AntdProvider({ children }: { children: React.ReactNode }) {
  const { theme: currentTheme = '' } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }
  function generateTheme(currentTheme: string) {
    const darkTokens = {
      colorBgLayout: '#1f1f1f',
      colorBgContainer: '#181818',
    };

    const lightTokens = {
      colorBgLayout: '#fff',
    };

    return {
      cssVar: true,
      algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: currentTheme === 'dark' ? darkTokens : lightTokens
    }
  }
  return (
    <ConfigProvider
      theme={generateTheme(currentTheme)}
    >
      {children}
    </ConfigProvider>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider attribute="class" defaultTheme="system">
      <AntdProvider>{children}</AntdProvider>
    </NextThemeProvider>
  );
} 