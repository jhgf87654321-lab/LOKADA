"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCloudbaseAuth } from "@/lib/cloudbase";
import { toast } from "sonner";

type Step = "email" | "register";

/**
 * CloudBase 独立注册表单
 * 邮箱验证码注册流程，不依赖任何 Better Auth 组件
 */
export default function CloudbaseRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [isPending, startTransition] = useTransition();
  const [codeSending, setCodeSending] = useState(false);

  // 邮箱步骤
  const [email, setEmail] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);

  // 注册步骤
  const [verificationCode, setVerificationCode] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 第一步：获取验证码
  const handleGetCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("请输入邮箱地址");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("请输入有效的邮箱地址");
      return;
    }

    setCodeSending(true);
    const auth = getCloudbaseAuth();

    if (!auth) {
      toast.error("CloudBase 未配置");
      setCodeSending(false);
      return;
    }

    try {
      const res = await auth.getVerification({ email: email.trim() });
      setVerificationId((res as { verification_id: string }).verification_id);
      setStep("register");
      toast.success("验证码已发送到邮箱，请查收");
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "发送验证码失败，请稍后重试";
      toast.error(errorMessage);
    } finally {
      setCodeSending(false);
    }
  };

  // 第二步：注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationId) {
      toast.error("请先获取邮箱验证码");
      return;
    }

    if (!verificationCode.trim()) {
      toast.error("请输入验证码");
      return;
    }

    if (!name.trim()) {
      toast.error("请输入昵称");
      return;
    }

    if (!username.trim()) {
      toast.error("请输入用户名");
      return;
    }

    if (username.trim().length < 5 || username.trim().length > 24) {
      toast.error("用户名为 5-24 位");
      return;
    }

    if (!password.trim()) {
      toast.error("请输入密码");
      return;
    }

    if (password.trim().length < 6) {
      toast.error("密码至少 6 位");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("两次密码不一致");
      return;
    }

    startTransition(async () => {
      const auth = getCloudbaseAuth();
      if (!auth) {
        toast.error("CloudBase 未配置");
        return;
      }

      try {
        // 先验证验证码
        const verifyRes = await auth.verify({
          verification_id: verificationId,
          verification_code: verificationCode.trim(),
        });

        const verificationToken =
          (verifyRes as { verification_token?: string })?.verification_token;

        if (!verificationToken) {
          toast.error("验证码校验失败");
          return;
        }

        // 注册
        await auth.signUp({
          email: email.trim(),
          verification_code: verificationCode.trim(),
          verification_token: verificationToken,
          name: name.trim(),
          password: password.trim(),
          username: username.trim(),
        });

        toast.success("注册成功");
        router.push("/auth/cloudbase/dashboard");
        router.refresh();
      } catch (err: unknown) {
        const errorMessage =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "注册失败，请稍后重试";
        toast.error(errorMessage);
      }
    });
  };

  if (step === "email") {
    return (
      <form onSubmit={handleGetCode} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            邮箱地址
          </label>
          <Input
            id="email"
            type="email"
            placeholder="请输入邮箱地址"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={codeSending}
            required
            className="w-full"
          />
        </div>

        <Button type="submit" disabled={codeSending} className="w-full">
          {codeSending ? "发送中..." : "获取验证码"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email-display" className="text-sm font-medium">
          邮箱
        </label>
        <Input
          id="email-display"
          type="email"
          value={email}
          disabled
          className="w-full bg-muted"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setStep("email");
            setVerificationCode("");
            setVerificationId(null);
          }}
          className="text-xs"
        >
          更换邮箱
        </Button>
      </div>

      <div className="space-y-2">
        <label htmlFor="verification-code" className="text-sm font-medium">
          邮箱验证码
        </label>
        <Input
          id="verification-code"
          type="text"
          placeholder="请输入 6 位验证码"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          disabled={isPending}
          required
          maxLength={6}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          昵称
        </label>
        <Input
          id="name"
          type="text"
          placeholder="请输入昵称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
          required
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium">
          用户名
        </label>
        <Input
          id="username"
          type="text"
          placeholder="5-24 位，支持中英文、数字、_、-"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isPending}
          required
          minLength={5}
          maxLength={24}
          className="w-full"
        />
        <p className="text-muted-foreground text-xs">
          用户名为 5-24 位，支持中英文、数字、_、-
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
            placeholder="至少 6 位"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            required
            minLength={6}
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

      <div className="space-y-2">
        <label htmlFor="confirm-password" className="text-sm font-medium">
          确认密码
        </label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="请再次输入密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isPending}
            required
            className="w-full pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            disabled={isPending}
          >
            {showConfirmPassword ? "隐藏" : "显示"}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "注册中..." : "注册"}
      </Button>
    </form>
  );
}
