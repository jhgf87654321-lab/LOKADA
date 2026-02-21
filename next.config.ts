import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: process.env.NODE_ENV === "production",
  },
  // 显式将 CloudBase 变量传入客户端（构建时内联）
  // CloudBase Run 构建时通过 Docker ARG/ENV 传入，本地开发从 .env 读取
  env: {
    NEXT_PUBLIC_CLOUDBASE_ENV: process.env.NEXT_PUBLIC_CLOUDBASE_ENV,
    NEXT_PUBLIC_CLOUDBASE_REGION: process.env.NEXT_PUBLIC_CLOUDBASE_REGION,
    NEXT_PUBLIC_CLOUDBASE_CLIENT_ID: process.env.NEXT_PUBLIC_CLOUDBASE_CLIENT_ID,
    NEXT_PUBLIC_CLOUDBASE_ACCESS_KEY: process.env.NEXT_PUBLIC_CLOUDBASE_ACCESS_KEY,
  },
};

export default nextConfig;
