"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getCloudbaseAuth } from "@/lib/cloudbase";

function isCloudbaseLoggedIn(auth: unknown) {
  const a = auth as any;
  const hasState = a?.hasLoginState?.() ?? a?.isLoginState?.();
  const u = a?.currentUser;
  const hasIdentity = Boolean(u && (u.phoneNumber || u.email || u.username));
  return Boolean(hasState && hasIdentity);
}

function normalizeCNPhone(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";

  // CloudBase 要求格式: "+86 13800138000"（国家码与号码之间必须有空格）
  const digits = trimmed.replace(/\D/g, "");
  if (!digits || digits.length !== 11) return "";
  return `+86 ${digits}`;
}

function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export default function CloudbaseLoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [loginMethod, setLoginMethod] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>("");
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

  useEffect(() => {
    const auth = getCloudbaseAuth();
    if (!auth) return;

    // 不自动跳转（避免 login <-> dashboard 循环）；只显示提示条。
    const check = async () => {
      try {
        const current = await Promise.race([
          auth.getCurrentUser(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200)),
        ]);
        const uid = (current as any)?.uid ?? (current as any)?.sub;
        setAlreadyLoggedIn(Boolean(uid));
      } catch {
        setAlreadyLoggedIn(false);
      }
    };

    void check();
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (loginMethod === "phone") {
      if (!phone.trim() || !password.trim()) {
        setError("请填写手机号和密码");
        return;
      }
      if (!normalizeCNPhone(phone)) {
        setError("请输入有效的11位手机号");
        return;
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setError("请填写邮箱和密码");
        return;
      }
      if (!validateEmail(email)) {
        setError("请输入有效的邮箱地址");
        return;
      }
    }

    startTransition(async () => {
      const auth = getCloudbaseAuth();
      if (!auth) {
        setError("CloudBase 未配置：请检查 NEXT_PUBLIC_CLOUDBASE_* 环境变量与控制台配置");
        return;
      }

      try {
        // CloudBase 密码登录：使用 username 字段，值为手机号或邮箱
        const username = loginMethod === "phone" 
          ? normalizeCNPhone(phone)
          : email.trim().toLowerCase();
        
        await auth.signIn({
          username,
          password: password.trim(),
        } as any);

        router.replace("/cloudbase/dashboard");
      } catch (err: unknown) {
        const rawMsg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "";

        if (loginMethod === "phone") {
          if (rawMsg.includes("provider phone not found") || rawMsg.includes("phone not found")) {
            setError("手机号登录未启用：请在云开发控制台「身份认证」→「登录方式」启用「手机号密码登录」或「手机号验证码登录」");
          } else if (rawMsg.includes("not_found") || rawMsg.includes("password_not_set")) {
            setError("手机号或密码错误");
          } else {
            setError(rawMsg || "登录失败");
          }
        } else {
          if (rawMsg.includes("provider email not found") || rawMsg.includes("email not found")) {
            setError("邮箱登录未启用：请在云开发控制台「身份认证」→「登录方式」启用「邮箱密码登录」或「邮箱验证码登录」");
          } else if (rawMsg.includes("not_found") || rawMsg.includes("password_not_set")) {
            setError("邮箱或密码错误");
          } else {
            setError(rawMsg || "登录失败");
          }
        }
      }
    });
  };

  return (
    <div className="min-h-[100svh] bg-background-light font-display flex flex-col">
      <div className="max-w-[1440px] mx-auto w-full px-6 pt-8">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          返回首页
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center size-16 bg-primary/10 text-primary rounded-2xl mb-4">
              <svg
                className="size-10"
                fill="none"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">登录</h1>
            <p className="mt-2 text-slate-500">使用手机号或邮箱登录以访问您的云端图片库</p>
          </div>

          {alreadyLoggedIn && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 text-center">
              当前浏览器检测到已登录状态。为避免跳转循环，这里不自动跳转。
              <button
                type="button"
                onClick={() => router.replace("/cloudbase/dashboard")}
                className="ml-2 font-bold text-primary hover:opacity-90"
              >
                去用户中心
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center mb-4">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            {/* 登录方式选择 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                登录方式
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("phone");
                    setPhone("");
                    setEmail("");
                    setError("");
                  }}
                  className={`py-3 px-4 rounded-xl border-2 transition-all font-medium ${
                    loginMethod === "phone"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  手机号
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("email");
                    setPhone("");
                    setEmail("");
                    setError("");
                  }}
                  className={`py-3 px-4 rounded-xl border-2 transition-all font-medium ${
                    loginMethod === "email"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  邮箱
                </button>
              </div>
            </div>

            {/* 手机号输入 */}
            {loginMethod === "phone" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">手机号</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="请输入手机号（11位）"
                  disabled={isPending}
                  required
                  pattern="[0-9]{11}"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
                <p className="mt-2 text-xs text-slate-500">系统将自动按中国大陆格式转换为 +86 手机号（不含空格）。</p>
              </div>
            )}

            {/* 邮箱输入 */}
            {loginMethod === "email" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">邮箱</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱地址"
                  disabled={isPending}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  disabled={isPending}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                  disabled={isPending}
                >
                  {showPassword ? "隐藏" : "显示"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "登录中..." : "立即登录"}
            </button>

            <div className="text-center text-sm text-slate-600">
              还没有账号？
              <button
                type="button"
                onClick={() => router.push("/cloudbase/register")}
                className="ml-1 font-bold text-primary hover:opacity-90"
              >
                去注册
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

