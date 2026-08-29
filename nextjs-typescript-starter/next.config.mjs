/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 客户端路由缓存（Router Cache）：dynamic 页面默认只缓存 30s，
    // 延长到 5 分钟 → 5 分钟内来回切 tab 直接复用已渲染页面，接近 SPA 无刷新
    staleTimes: {
      dynamic: 300,
      static: 300,
    },
  },
};

export default nextConfig;
