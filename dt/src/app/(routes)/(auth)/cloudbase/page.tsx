"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCloudbaseAuthOptional } from "@/providers/cloudbase-auth-provider";
import CloudbaseSignOutButton from "./components/button-signout";

export default function CloudbasePage() {
  const ctx = useCloudbaseAuthOptional();

  useEffect(() => {
    if (!ctx?.isReady) return;
    if (!ctx.user) {
      window.location.href = "/cloudbase/signin";
    }
  }, [ctx?.isReady, ctx?.user]);

  if (!ctx?.isReady || ctx.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">加载中…</p>
      </div>
    );
  }

  if (!ctx.user) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-foreground/10 bg-card px-8 py-6 shadow-sm">
        <h1 className="text-xl font-semibold">CloudBase 已登录</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          当前使用腾讯云 CloudBase 身份认证
        </p>
        <dl className="mt-6 space-y-2 text-sm">
          {ctx.user.name != null && (
            <div>
              <dt className="text-muted-foreground">昵称</dt>
              <dd className="font-medium">{ctx.user.name}</dd>
            </div>
          )}
          {ctx.user.username != null && (
            <div>
              <dt className="text-muted-foreground">用户名</dt>
              <dd className="font-medium">{ctx.user.username}</dd>
            </div>
          )}
          {ctx.user.email != null && (
            <div>
              <dt className="text-muted-foreground">邮箱</dt>
              <dd className="font-medium">{ctx.user.email}</dd>
            </div>
          )}
          {(ctx.user.uid ?? ctx.user.sub) != null && (
            <div>
              <dt className="text-muted-foreground">用户 ID</dt>
              <dd className="font-mono text-xs">
                {ctx.user.uid ?? ctx.user.sub}
              </dd>
            </div>
          )}
        </dl>
        <div className="mt-8 flex flex-col gap-3">
          <CloudbaseSignOutButton />
          <Link
            href="/"
            className="text-muted-foreground text-center text-sm hover:underline"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
