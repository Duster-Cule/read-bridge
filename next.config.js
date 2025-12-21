const isProd = process.env.NODE_ENV === 'production';

const internalHost = process.env.TAURI_DEV_HOST || 'localhost';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@ant-design/icons', '@ant-design/icons-svg', 'antd'],
  modularizeImports: {
    '@ant-design/icons': {
      transform: '@ant-design/icons/lib/icons/{{ member }}',
    },
  },
  // Web-only mode needs API routes (e.g. /api/dict/query), which are not available with `output: 'export'`.
  // If you truly need a pure static export, the offline dictionary must be implemented client-side (large DB makes that non-trivial).
  // output: 'export',
  images: {
    unoptimized: true,
  },
  // 配置 assetPrefix，否则服务器无法正确解析您的资产。
  assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
}

module.exports = nextConfig 