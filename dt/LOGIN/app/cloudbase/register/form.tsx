"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getCloudbaseAuth } from "@/lib/cloudbase";

type Step = "phone" | "register";

/**
 * CloudBase 注册表单（手机号验证码 + 用户名密码）
 *
 * 流程：
 * 1. 输入手机号（+86 开头）获取短信验证码（auth.getVerification）
 * 2. 输入验证码 + 用户名 + 密码，调用 verify + signUp 完成注册
 */
export default function CloudbaseRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [isPending, startTransition] = useTransition();
  const [codeSending, setCodeSending] = useState(false);
  const [error, setError] = useState("");

  // 手机号步骤
  const [phone, setPhone] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);

  // 注册步骤
  const [verificationCode, setVerificationCode] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleGetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phone.trim()) {
      setError("请输入手机号");
      return;
    }

    const normalizedPhone = phone.startsWith("+")
      ? phone.trim()
      : `+86 ${phone.trim()}`;

    setCodeSending(true);
    const auth = getCloudbaseAuth();

    if (!auth) {
      setError("CloudBase 未配置");
      setCodeSending(false);
      return;
    }

    try {
      const res = await auth.getVerification({ phone_number: normalizedPhone });
      setVerificationId((res as { verification_id: string }).verification_id);
      setStep("register");
      setError("");
    } catch (err: unknown) {
      const rawMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "";

      if (rawMsg.includes("provider phone not found") || rawMsg.includes("phone not found")) {
        setError("手机号注册未启用：请在云开发控制台「身份认证」→「登录方式」中启用「手机号验证码登录」");
      } else {
        setError(rawMsg || "发送验证码失败");
      }
    } finally {
      setCodeSending(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!verificationId) {
      setError("请先获取验证码");
      return;
    }

    if (!verificationCode.trim() || !name.trim() || !username.trim() || !password.trim()) {
      setError("请填写所有必填项");
      return;
    }

    if (username.trim().length < 5 || username.trim().length > 24) {
      setError("用户名为 5-24 位");
      return;
    }

    if (password.trim().length < 6) {
      setError("密码至少 6 位");
      return;
    }

    if (password !== confirmPassword) {
      setError("两次密码不一致");
      return;
    }

    startTransition(async () => {
      const auth = getCloudbaseAuth();
      if (!auth) {
        setError("CloudBase 未配置");
        return;
      }

      try {
        const verifyRes = await auth.verify({
          verification_id: verificationId,
          verification_code: verificationCode.trim(),
        });

        const verificationToken =
          (verifyRes as { verification_token?: string })?.verification_token;

        if (!verificationToken) {
          setError("验证码错误");
          return;
        }

        await auth.signUp({
          phone_number: phone.startsWith("+") ? phone.trim() : `+86 ${phone.trim()}`,
          verification_code: verificationCode.trim(),
          verification_token: verificationToken,
          name: name.trim(),
          password: password.trim(),
          username: username.trim(),
        });

        router.push("/cloudbase/dashboard");
        router.refresh();
      } catch (err: unknown) {
        const rawMsg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "";

        if (rawMsg.includes("provider phone not found") || rawMsg.includes("phone not found")) {
          setError("手机号注册未启用：请在云开发控制台「身份认证」→「登录方式」中启用「手机号验证码登录」");
        } else if (rawMsg.includes("failed_precondition") || rawMsg.includes("already registered")) {
          setError("该手机号已被注册，请直接登录");
        } else {
          setError(rawMsg || "注册失败");
        }
      }
    });
  };

  if (step === "phone") {
    return (
      <form onSubmit={handleGetCode} className="cloudbase-auth-form">
        {error && <div className="cloudbase-error">{error}</div>}
        <div className="cloudbase-form-group">
          <input
            type="tel"
            placeholder="手机号（不带 +86）"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={codeSending}
            required
            className="cloudbase-input"
          />
        </div>
        <button
          type="submit"
          disabled={codeSending}
          className="cloudbase-button"
        >
          {codeSending ? "发送中..." : "获取验证码"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRegister} className="cloudbase-auth-form">
      {error && <div className="cloudbase-error">{error}</div>}

      <div className="cloudbase-form-group">
        <input
          type="tel"
          value={phone}
          disabled
          className="cloudbase-input cloudbase-input-disabled"
        />
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setVerificationCode("");
            setVerificationId(null);
          }}
          className="cloudbase-link-button"
        >
          更换手机号
        </button>
      </div>

      <div className="cloudbase-form-group">
        <input
          type="text"
          placeholder="验证码（6位）"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          disabled={isPending}
          required
          maxLength={6}
          className="cloudbase-input"
        />
      </div>

      <div className="cloudbase-form-group">
        <input
          type="text"
          placeholder="昵称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
          required
          className="cloudbase-input"
        />
      </div>

      <div className="cloudbase-form-group">
        <input
          type="text"
          placeholder="用户名（5-24位）"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isPending}
          required
          minLength={5}
          maxLength={24}
          className="cloudbase-input"
        />
      </div>

      <div className="cloudbase-form-group">
        <div className="cloudbase-password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="密码（至少6位）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            required
            minLength={6}
            className="cloudbase-input"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="cloudbase-password-toggle"
            disabled={isPending}
          >
            {showPassword ? "隐藏" : "显示"}
          </button>
        </div>
      </div>

      <div className="cloudbase-form-group">
        <input
          type="password"
          placeholder="确认密码"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isPending}
          required
          className="cloudbase-input"
        />
      </div>

      <button type="submit" disabled={isPending} className="cloudbase-button">
        {isPending ? "注册中..." : "注册"}
      </button>
    </form>
  );
}
