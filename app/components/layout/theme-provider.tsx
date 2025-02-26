'use client';

import { ConfigProvider, theme } from 'antd';
import { AliasToken } from 'antd/es/theme/internal';
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
      colorBgElevated: '#313131'
    };

    const lightTokens = {
      colorBgLayout: '#fff',
    };
    const CardLightToken = {
      bodyPadding: 8,
      colorBorderSecondary: '#d4d4d4',
    }
    const CardDarkToken = {
      colorBgContainer: '#313131',
      colorBorderSecondary: '#636363',
      bodyPadding: 8,
    }

    return {
      cssVar: true,
      algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: currentTheme === 'dark' ? darkTokens : lightTokens,
      components: {
        Card: currentTheme === 'dark' ? CardDarkToken : CardLightToken
      }
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