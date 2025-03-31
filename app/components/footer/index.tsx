'use client';

import { Button, ColorPicker, theme } from 'antd';
import { useTheme } from 'next-themes';
import { useStyleStore } from '@/store/useStyleStore';
import { useEffect, useState } from 'react';


export default function Footer() {
  const { theme: currentTheme } = useTheme();
  const { token } = theme.useToken();
  const {
    lightModeTextColor,
    darkModeTextColor,
    setLightModeTextColor,
    setDarkModeTextColor
  } = useStyleStore();
  const [mounted, setMounted] = useState(false);
  const [tempColor, setTempColor] = useState('');

  useEffect(() => {
    setMounted(true);
    setTempColor(currentTheme === 'dark' ? darkModeTextColor : lightModeTextColor);
  }, [currentTheme, darkModeTextColor, lightModeTextColor]);

  if (!mounted) return null;

  const handleConfirm = () => {
    if (currentTheme === 'dark') {
      setDarkModeTextColor(tempColor);
    } else {
      setLightModeTextColor(tempColor);
    }
  };


  return (
    <div className="w-full h-full flex justify-start items-center border-t pl-4 pr-4 " style={{ borderColor: token.colorBorder }}>
      <ColorPicker
        value={tempColor}
        size="small"
        onChange={(color) => {
          setTempColor(color.toHexString());
        }}
        panelRender={(panel) => (
          <div className="flex flex-col gap-2">
            {panel}
            <Button type="text" block onClick={handleConfirm}>
              更改字体颜色
            </Button>
          </div>
        )}
      />
    </div>
  )
}
