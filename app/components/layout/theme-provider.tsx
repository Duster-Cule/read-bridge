'use client';

import { ConfigProvider, theme } from 'antd';
import { ThemeProvider as NextThemeProvider, useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useStyleStore } from '@/store/useStyleStore';

function AntdProvider({ children }: { children: React.ReactNode }) {
  const { theme: currentTheme = '' } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { lightModeTextColor, darkModeTextColor } = useStyleStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.style.setProperty(
        '--primary-text-color',
        currentTheme === 'dark' ? darkModeTextColor : lightModeTextColor
      );
    }
  }, [currentTheme, lightModeTextColor, darkModeTextColor, mounted]);

  if (!mounted) {
    return null;
  }
  function generateTheme(currentTheme: string) {
    const algorithm = currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm;
    return {
      cssVar: true,
      algorithm: algorithm,
      token: getToken(currentTheme),
      components: getComponentsToken(currentTheme)
    }
  }
  // 修改主要主题色 
  function getToken(currentTheme: string) {
    const tokens = {
      dark: {
        colorBgLayout: '#1f1f1f',
        colorBgContainer: '#181818',
        colorBgElevated: '#313131',
        colorText: darkModeTextColor,
      },
      light: {
        colorBgLayout: '#fff',
        colorText: lightModeTextColor,
      }
    };
    return tokens[currentTheme === 'dark' ? 'dark' : 'light'];
  }

  // 修改组件样式
  function getComponentsToken(currentTheme: string) {
    const components = {
      dark: {
        Card: {
          colorBgContainer: '#313131',
          colorBorderSecondary: '#636363',
          bodyPadding: 8
        },
        Menu: {
          colorBgContainer: '#1f1f1f',
        }
      },
      light: {
        Card: {
          bodyPadding: 8,
          colorBorderSecondary: '#d4d4d4'
        }
      },
    };

    return components[currentTheme === 'dark' ? 'dark' : 'light'];
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