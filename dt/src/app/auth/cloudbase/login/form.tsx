"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCloudbaseAuth } from "@/lib/cloudbase";
import { toast } from "sonner";

/**
 * CloudBase 独立登录表单
 * 不依赖任何 Better Auth 组件或逻辑
 */
export default function CloudbaseLoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error("请输入用户名、邮箱或手机号");
      return;
    }

    if (!password.trim()) {
      toast.error("请输入密码");
      return;
    }

    startTransition(async () => {
      const auth = getCloudbaseAuth();
      if (!auth) {
        toast.error(
          "CloudBase 未配置，请在 .env 中设置 NEXT_PUBLIC_CLOUDBASE_ENV 和 NEXT_PUBLIC_CLOUDBASE_CLIENT_ID"
        );
        return;
      }

      try {
        await auth.signIn({
          username: username.trim(),
          password: password.trim(),
        });

        toast.success("登录成功");
        router.push("/auth/cloudbase/dashboard");
        router.refresh();
      } catch (err: unknown) {
        const errorMessage =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "登录失败，请检查用户名和密码";

        const isCorsError = /cors|permission|安全来源|denied|域名/i.test(
          errorMessage
        );

        if (isCorsError) {
          toast.error(
            "连接被拒绝：请在云开发控制台「安全来源」中添加当前访问域名"
          );
        } else {
          toast.error(errorMessage);
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium">
          用户名 / 邮箱 / 手机号
        </label>
        <Input
          id="username"
          type="text"
          placeholder="手机号请加 +86 前缀，如 +86 138xxxxxxxx"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isPending}
          required
          className="w-full"
        />
        <p className="text-muted-foreground text-xs">
          支持手机号（需 +86 前缀）、邮箱或自定义用户名
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          密码
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            required
            className="w-full pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            disabled={isPending}
          >
            {showPassword ? "隐藏" : "显示"}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "登录中..." : "登录"}
      </Button>
    </form>
  );
}
