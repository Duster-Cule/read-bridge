"use client"

import { Layout } from "antd";
import HeaderContent from "@/src/components/header";
import FooterContent from "@/src/components/footer";
import Sider from "@/src/components/sider";
import { CSSProperties, useEffect, useState } from "react";
import { useHeaderStore } from "@/src/store/useHeaderStore";
import { Button, Tooltip } from "antd";
import { CaretDownFilled } from "@ant-design/icons";
import { theme } from "antd";

const { Header, Content, Footer } = Layout;

const layoutStyle: CSSProperties = {
  height: '100vh',
  width: '100%',
  maxWidth: '1920px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
};

// Dynamic header style will be used instead of this static one
const headerStyle: CSSProperties = {
  height: 'auto',
  lineHeight: '64px',
  position: 'sticky',
  top: 0,
  zIndex: 1,
  padding: 0,
  width: '100%',
  transition: 'all 0.3s ease-in-out',
  overflow: 'hidden',
};

const contentStyle: CSSProperties = {
  flex: 1,
  overflow: 'auto',
};

const footerStyle: CSSProperties = {
  position: 'sticky',
  bottom: 0,
  padding: '0',
  width: '100%',
  height: '24px',
};

const headerToggleButtonStyle: CSSProperties = {
  position: 'fixed',
  top: '-8px',
  right: '40px',
  zIndex: 2,
  opacity: 1,
  transition: 'all 0.3s ease-in-out',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  width: '32px',
  height: '28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transform: 'translateY(0)',
  cursor: 'pointer',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { collapsed, toggleCollapsed } = useHeaderStore();
  const { token } = theme.useToken();

  // Dynamic header height based on collapsed state
  const dynamicHeaderStyle: CSSProperties = {
    ...headerStyle,
    height: collapsed ? '0' : '64px',
    opacity: collapsed ? 0 : 1,
    pointerEvents: collapsed ? 'none' : 'auto',
  };

  // Dynamic toggle button style
  const dynamicToggleButtonStyle: CSSProperties = {
    ...headerToggleButtonStyle,
    opacity: collapsed ? 1 : 0,
    transform: collapsed ? 'translateY(0)' : 'translateY(-100%)',
    pointerEvents: collapsed ? 'auto' : 'none',
    backgroundColor: token.colorBgContainer,
    color: token.colorText,
    border: `1px solid ${token.colorBorder}`,
  };

  const iconStyle: CSSProperties = {
    fontSize: 16,
    transition: 'transform 0.3s ease',
  };

  return (
    <Layout style={layoutStyle}>
      <Header style={dynamicHeaderStyle}><HeaderContent /></Header>
      {collapsed && (
        <Button
          type="text"
          icon={<CaretDownFilled style={iconStyle} className="transform translate-y-[4px]" />}
          style={dynamicToggleButtonStyle}
          onClick={toggleCollapsed}
          className="transition-all duration-300"
        />
      )}
      <div className="flex flex-1 overflow-hidden flex-row">
        <Content style={{ ...contentStyle }}>
          {children}
        </Content>
        <Sider />
      </div>
      <Footer style={footerStyle}><FooterContent /></Footer>
    </Layout>
  );
}