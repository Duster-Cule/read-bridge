import React, { ReactNode } from 'react';
import { Card } from 'antd';

interface CardComponentProps {
  title: string;
  children: ReactNode;
  loading?: boolean;
  className?: string;
}

export default function CardComponent({ title, children, loading = false, className = '' }: CardComponentProps) {
  return (
    <Card
      className={`min-h-[60px] bg-[var(--card-bg-color)] border-[var(--ant-color-border)] ${className}`}
      loading={loading}
      hoverable
    >
      <div className="text-lg font-semibold text-[var(--ant-color-text)]">{title}</div>
      <div>{children}</div>
    </Card>
  );
} 