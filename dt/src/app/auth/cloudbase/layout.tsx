import type { Metadata } from "next";
import { CloudbaseAuthProvider } from "@/providers/cloudbase-auth-provider";

export const metadata: Metadata = {
  title: "CloudBase 身份认证",
  description: "腾讯云 CloudBase 独立认证系统",
};

/**
 * CloudBase 认证独立布局
 * 完全独立于 Better Auth，不共享任何组件或逻辑
 * 
 * 注意：虽然 CloudbaseAuthProvider 是客户端组件，但布局本身是服务端组件
 * Next.js 会自动处理客户端组件的嵌套
 */
export default function CloudbaseAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CloudbaseAuthProvider>
      <div className="min-h-screen bg-background">{children}</div>
    </CloudbaseAuthProvider>
  );
}
