"use client"

import { Layout } from "antd";
import HeaderContent from "@/app/components/header";
import Sider from "@/app/components/sider";
import { CSSProperties } from "react";

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

const headerStyle: CSSProperties = {
  height: '64px',
  lineHeight: '64px',
  position: 'sticky',
  top: 0,
  zIndex: 1,
  padding: 0,
  width: '100%',
};

const contentStyle: CSSProperties = {
  flex: 1,
  overflow: 'auto',
};


const footerStyle: CSSProperties = {
  position: 'sticky',
  bottom: 0,
  width: '100%',
  height: '24px',
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout style={layoutStyle}>
      <Header style={headerStyle}><HeaderContent /></Header>
      <div className="flex flex-1 overflow-hidden flex-row">
        <Content style={{ ...contentStyle }}>
          {children}
        </Content>
        <Sider />
      </div>
      <Footer style={footerStyle}>Footer</Footer>
    </Layout>
  );
}