"use client";

import { useRef } from "react";
import { Layout, Menu, theme } from "antd";
import type { MenuProps } from "antd";
import { StarIcon } from "@/assets/icon";
import { AppstoreFilled } from "@ant-design/icons";
import React from "react";

import AiSection from "./components/AiSection";
import DefaultModelSection from "./components/DefaultModelSection";

const { Sider, Content } = Layout;


// Settings configuration
const settingsConfig = [
  {
    key: "ai",
    icon: <StarIcon />,
    label: "模型设置",
    content: <AiSection />
  },
  {
    key: 'defaultModel',
    icon: <AppstoreFilled style={{ fontSize: 24 }} />,
    label: "默认模型",
    content: <DefaultModelSection />
  }
];

export default function Setting() {
  const { token } = theme.useToken();

  // Refs for scroll targets
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Menu items derived from config
  const menuItems: MenuProps['items'] = settingsConfig.map(({ key, icon, label }) => ({
    key,
    icon: React.cloneElement(icon, { color: token.colorText }),
    label,
  }));

  // Handle menu item click
  const handleMenuClick = (key: string) => {
    const ref = sectionRefs.current[key];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Layout className="w-full h-full p-4" >
      <Sider
        width={200}
        style={{
          background: token.colorBgContainer,
          position: "fixed",
          left: 0,
          overflow: "auto",
        }}
      >
        <Menu
          mode="inline"
          style={{ borderRight: 0 }}
          items={menuItems}
          defaultSelectedKeys={["ai"]}
          onClick={({ key }) => handleMenuClick(key.toString())}
        />
      </Sider>
      <Content
        className="w-full h-full pl-[224px] m-0"
      >
        {settingsConfig.map(({ key, icon, label, content }) => (
          <div
            key={key}
            ref={(el) => { sectionRefs.current[key] = el }}
            id={key}
            className="mb-4"
          >
            <div className="flex items-center gap-2 mb-4">
              {React.cloneElement(icon, { color: token.colorText })}
              <div className="text-[24px] font-bold">{label}</div>
            </div>

            {content}

          </div>
        ))}
      </Content>
    </Layout>
  );
}

