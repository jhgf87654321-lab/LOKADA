"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCloudbaseAuthOptional } from "@/providers/cloudbase-auth-provider";
import { Button } from "@/components/ui/button";
import { getCloudbaseAuth } from "@/lib/cloudbase";

/**
 * CloudBase 用户信息展示页面
 * 完全独立于 Better Auth
 */
export default function CloudbaseDashboardPage() {
  const router = useRouter();
  const ctx = useCloudbaseAuthOptional();

  useEffect(() => {
    if (!ctx?.isReady) return;
    if (!ctx.user) {
      router.push("/auth/cloudbase/login");
    }
  }, [ctx?.isReady, ctx?.user, router]);

  const handleSignOut = async () => {
    const auth = getCloudbaseAuth();
    if (auth) {
      try {
        await auth.signOut();
        ctx?.signOut?.();
        router.push("/auth/cloudbase/login");
        router.refresh();
      } catch (err) {
        console.error("退出登录失败:", err);
      }
    }
  };

  if (!ctx?.isReady || ctx.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!ctx.user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">CloudBase 用户中心</h1>
          <p className="text-muted-foreground text-sm">
            欢迎使用腾讯云 CloudBase 身份认证系统
          </p>
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-6">
          <h2 className="text-lg font-semibold">用户信息</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ctx.user.name && (
              <div>
                <dt className="text-muted-foreground text-sm">昵称</dt>
                <dd className="font-medium">{ctx.user.name}</dd>
              </div>
            )}
            {ctx.user.username && (
              <div>
                <dt className="text-muted-foreground text-sm">用户名</dt>
                <dd className="font-medium">{ctx.user.username}</dd>
              </div>
            )}
            {ctx.user.email && (
              <div>
                <dt className="text-muted-foreground text-sm">邮箱</dt>
                <dd className="font-medium">{ctx.user.email}</dd>
              </div>
            )}
            {ctx.user.phoneNumber && (
              <div>
                <dt className="text-muted-foreground text-sm">手机号</dt>
                <dd className="font-medium">{ctx.user.phoneNumber}</dd>
              </div>
            )}
            {(ctx.user.uid || ctx.user.sub) && (
              <div>
                <dt className="text-muted-foreground text-sm">用户 ID</dt>
                <dd className="font-mono text-xs">
                  {ctx.user.uid || ctx.user.sub}
                </dd>
              </div>
            )}
            {ctx.user.emailVerified !== undefined && (
              <div>
                <dt className="text-muted-foreground text-sm">邮箱验证</dt>
                <dd className="font-medium">
                  {ctx.user.emailVerified ? "已验证" : "未验证"}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleSignOut} variant="destructive" className="w-full sm:w-auto">
            退出登录
          </Button>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full sm:w-auto"
          >
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
}
