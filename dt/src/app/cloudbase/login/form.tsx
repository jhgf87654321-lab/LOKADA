"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getCloudbaseAuth } from "@/lib/cloudbase";

export default function CloudbaseLoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("请填写用户名和密码");
      return;
    }

    startTransition(async () => {
      const auth = getCloudbaseAuth();
      if (!auth) {
        setError("CloudBase 未配置");
        return;
      }

      try {
        await auth.signIn({
          username: username.trim(),
          password: password.trim(),
        });
        router.push("/cloudbase/dashboard");
        router.refresh();
      } catch (err: unknown) {
        const rawMsg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "";
        
        if (rawMsg.includes("provider email not found") || rawMsg.includes("email not found")) {
          setError("邮箱登录未启用：请在云开发控制台「身份认证」→「登录方式」中启用「邮箱密码登录」或「邮箱验证码登录」");
        } else if (rawMsg.includes("not_found") || rawMsg.includes("password_not_set")) {
          setError("用户名或密码错误");
        } else {
          setError(rawMsg || "登录失败");
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="cloudbase-auth-form">
      {error && <div className="cloudbase-error">{error}</div>}
      
      <div className="cloudbase-form-group">
        <input
          type="text"
          placeholder="用户名/邮箱/手机号"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isPending}
          required
          className="cloudbase-input"
        />
      </div>

      <div className="cloudbase-form-group">
        <div className="cloudbase-password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            required
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

      <button
        type="submit"
        disabled={isPending}
        className="cloudbase-button"
      >
        {isPending ? "登录中..." : "登录"}
      </button>
    </form>
  );
}
