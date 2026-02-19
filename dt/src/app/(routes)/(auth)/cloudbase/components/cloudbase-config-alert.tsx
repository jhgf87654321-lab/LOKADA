"use client";

import { useEffect, useState } from "react";
import { getCloudbaseAuth } from "@/lib/cloudbase";

/**
 * 检测 CloudBase 是否已配置；未配置时在页面上显示说明，避免“无法连接”无提示。
 */
export default function CloudbaseConfigAlert() {
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setConfigured(getCloudbaseAuth() != null);
    } catch {
      // CloudBase 初始化失败时，显示未配置提示
      setConfigured(false);
    }
  }, []);

  if (configured !== false) return null;

  return (
    <div
      className="mb-6 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200"
      role="alert"
    >
      <p className="font-medium">CloudBase 无法连接：未完成配置</p>
      <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
        <li>
          在项目根目录 <code className="rounded bg-black/10 px-1">.env</code> 中增加：
          <br />
          <code className="mt-1 block rounded bg-black/10 px-2 py-1 text-xs">
            NEXT_PUBLIC_CLOUDBASE_ENV=你的环境ID
            <br />
            NEXT_PUBLIC_CLOUDBASE_CLIENT_ID=你的Client ID
          </code>
        </li>
        <li>
          在{" "}
          <a
            href="https://tcb.cloud.tencent.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            腾讯云开发控制台
          </a>{" "}
          → 环境配置 → <strong>安全来源</strong> 中，添加当前访问域名（例如{" "}
          <code>http://localhost:3000</code>），否则接口会报错。
        </li>
        <li>修改 .env 后需重启开发服务器（重新运行 npm run dev）。</li>
      </ol>
    </div>
  );
}
