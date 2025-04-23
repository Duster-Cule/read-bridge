import { theme } from "antd";

export default function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  const { token } = theme.useToken();
  return <div className={`w-full p-4 border rounded-lg ${className}`} style={{ borderColor: token.colorBorder }}>
    {children}
  </div>;
}


