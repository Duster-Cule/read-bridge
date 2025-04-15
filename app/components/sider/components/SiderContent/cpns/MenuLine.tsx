import { Menu, MenuProps } from "antd";
import React from "react";

function MenuLine({
  selectedTab,
  items,
  onTabChange
}: {
  selectedTab: string,
  items: { label: string, key: string, disabled?: boolean }[],
  onTabChange: (key: string) => void
}) {
  const onClick: MenuProps['onClick'] = (e) => {
    onTabChange(e.key);
  };
  console.log(items, 'MenuLine items')
  return (
    <Menu
      mode="horizontal"
      items={items}
      selectedKeys={[selectedTab]}
      onClick={onClick}
      className="w-full [&_.ant-menu-item]:flex-1 [&_.ant-menu-item]:text-center [&_.ant-menu-item::after]:!w-full [&_.ant-menu-item::after]:!left-0"
    />
  )
}

const MemoizedMenuLine = React.memo(MenuLine);
MemoizedMenuLine.displayName = 'MenuLine';

export default MemoizedMenuLine;