'use client';
import { useRouter } from 'next/navigation';
import { theme } from 'antd';
import { LogoIcon } from '@/assets/icon';
import { GithubOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { Button, Menu } from 'antd';
import { useTheme } from 'next-themes';
import { useState } from 'react';

export default function Header() {
  const { token } = theme.useToken();
  const { theme: currentTheme, setTheme } = useTheme();

  return (
    <div className="header flex justify-between w-full h-full shadow-sm"
      style={{
        backgroundColor: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorder}`
      }}>
      <HeaderLogoArea theme={currentTheme} />
      <HeaderContentArea />
      <HeaderIconArea theme={currentTheme} toggleTheme={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')} />
    </div>
  );
}

function HeaderLogoArea({ theme }: { theme?: string }) {
  const router = useRouter();

  return (
    <div className="flex w-[16%] min-w-[200px] h-full items-center pl-[40px] cursor-pointer" onClick={() => router.push('/')}>
      <LogoIcon size={32} color={theme === 'dark' ? '#fff' : '#54808C'} />
      <div className="text-[18px] font-bold ml-2">
        Read Bridge
      </div>
    </div>
  )
}

function HeaderContentArea() {
  const items = [
    {
      label: '首页',
      key: '/',
    },
    {
      label: '阅读',
      key: '/read',
    },
  ]
  const router = useRouter();
  const [current, setCurrent] = useState('/');
  const onClick = (info: { key: string }) => {
    setCurrent(info.key);
    router.push(info.key);
  };
  return (
    <div className="flex w-full h-full ">
      <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={items} />
    </div>
  )
}

function HeaderIconArea({ theme, toggleTheme }: { theme?: string, toggleTheme: () => void }) {
  const iconStyle = { fontSize: 20 };
  const ThemeIcon = theme === 'dark' ? SunOutlined : MoonOutlined;

  return (
    <div className="flex w-[16%] h-full items-center justify-end pr-[40px]">
      <Button type="text" size="large" icon={<GithubOutlined style={iconStyle} />} />
      <Button type="text" size="large" icon={<ThemeIcon style={iconStyle} />} onClick={toggleTheme} />
    </div>
  )
}
