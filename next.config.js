/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@ant-design/icons', '@ant-design/icons-svg', 'antd'],
  modularizeImports: {
    '@ant-design/icons': {
      transform: '@ant-design/icons/lib/icons/{{ member }}',
      skipDefaultConversion: true,
    },
  },
  webpack: (config) => {
    return config;
  },
}

module.exports = nextConfig 