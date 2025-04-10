"use client"

import React from 'react';
import { Spin, Space } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface PageLoadingProps {
  tip?: string;
  size?: number;
  fullScreen?: boolean;
}

export default function PageLoading({
  tip = "loading...",
  size = 40,
  fullScreen = true
}: PageLoadingProps) {
  const antIcon = <LoadingOutlined style={{ fontSize: size }} spin />;

  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'w-full h-full min-h-[400px]' : ''}`}>
      <Space direction="vertical" align="center">
        <Spin indicator={antIcon} tip={tip} size="large" />
      </Space>
    </div>
  );
}