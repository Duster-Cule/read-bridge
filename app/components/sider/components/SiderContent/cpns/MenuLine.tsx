import { Menu, MenuProps } from "antd";

export default function MenuLine({
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