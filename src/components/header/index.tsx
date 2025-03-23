'use client';
import { useRouter } from 'next/navigation';
import { theme } from 'antd';
import { LogoIcon } from '@/assets/icon';
import { GithubOutlined, SunOutlined, MoonOutlined, CaretUpFilled } from '@ant-design/icons';
import { Button, Menu, Tooltip } from 'antd';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { useSiderStore } from '@/src/store/useSiderStore';
import { useHeaderStore } from '@/src/store/useHeaderStore';
import { CSSProperties } from 'react';

export default function Header() {
  const { token } = theme.useToken();
  const { theme: currentTheme, setTheme } = useTheme();
  const { collapsed } = useHeaderStore();

  return (
    <div
      className={`header flex justify-between w-full h-full shadow-sm transition-all duration-300 ease-in-out`}
      style={{
        backgroundColor: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorder}`,
        overflow: 'hidden',
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
  const { readingId } = useSiderStore()
  const items = [
    {
      label: '首页',
      key: '/',
    },
    {
      label: '阅读',
      key: '/read',
      disabled: !readingId,
    },
  ]
  const router = useRouter();
  const current = usePathname().split('?')[0]
  const onClick = (info: { key: string }) => {
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
  const { toggleCollapsed } = useHeaderStore();

  function handleToGithub() {
    window.open('https://github.com/WindChimeEcho/read-bridge', '_blank');
  }

  function handlePutAway() {
    toggleCollapsed();
  }

  return (
    <div className="flex w-[16%] h-full items-center justify-end pr-[40px]">

      <Button
        type="text"
        size="large"
        icon={<CaretUpFilled style={{ ...iconStyle, transition: 'transform 0.3s' }} className="transform hover:translate-y-[-2px]" />}
        onClick={handlePutAway}
        className="transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      />
      <Button
        type="text"
        size="large"
        icon={<GithubOutlined style={iconStyle} />}
        onClick={handleToGithub}
        className="transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      />
      <Button
        type="text"
        size="large"
        icon={<ThemeIcon style={iconStyle} />}
        onClick={toggleTheme}
        className="transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      />

    </div>
  )
}
