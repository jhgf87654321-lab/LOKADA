"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getCloudbaseAuth } from "@/lib/cloudbase";

type Step = "input" | "register";
type RegisterMethod = "phone" | "email";

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

export default function CloudbaseRegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>("input");
  const [registerMethod, setRegisterMethod] = useState<RegisterMethod>("phone");
  const [error, setError] = useState<string>("");
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [codeSending, setCodeSending] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);

  const [verificationCode, setVerificationCode] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const normalizedPhone = useMemo(() => normalizeCNPhone(phone), [phone]);
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  useEffect(() => {
    const auth = getCloudbaseAuth();
    if (!auth) return;

    // 不自动跳转（避免 register/login <-> dashboard 循环）；只显示提示条。
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
  }, [router]);

  const handleGetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (registerMethod === "phone") {
      if (!phone.trim()) {
        setError("请输入手机号");
        return;
      }
      if (!normalizedPhone) {
        setError("请输入有效的11位手机号");
        return;
      }
    } else {
      if (!email.trim()) {
        setError("请输入邮箱地址");
        return;
      }
      if (!validateEmail(email)) {
        setError("请输入有效的邮箱地址");
        return;
      }
    }

    const auth = getCloudbaseAuth();
    if (!auth) {
      setError("CloudBase 未配置：请检查 NEXT_PUBLIC_CLOUDBASE_* 环境变量与控制台配置");
      return;
    }

    setCodeSending(true);
    try {
      const res = registerMethod === "phone"
        ? await auth.getVerification({ phone_number: normalizedPhone })
        : await auth.getVerification({ email: normalizedEmail });

      const vid =
        (res as any)?.verification_id ??
        (res as any)?.verificationId ??
        (res as any)?.data?.verification_id ??
        null;

      if (!vid || typeof vid !== "string") {
        setError("验证码已发送，但未获取 verification_id，请重试");
        return;
      }

      const existing =
        (res as any)?.is_user ??
        (res as any)?.isUser ??
        (res as any)?.data?.is_user ??
        null;

      setVerificationId(vid);
      setIsExistingUser(typeof existing === "boolean" ? existing : null);
      setStep("register");
    } catch (err: unknown) {
      const rawMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "";

      if (registerMethod === "phone") {
        if (rawMsg.includes("provider phone not found") || rawMsg.includes("phone not found")) {
          setError("手机号验证码注册未启用：请在云开发控制台「身份认证」→「登录方式」启用「手机号验证码登录」（上海地域）");
        } else {
          setError(rawMsg || "发送验证码失败");
        }
      } else {
        if (rawMsg.includes("provider email not found") || rawMsg.includes("email not found")) {
          setError("邮箱验证码注册未启用：请在云开发控制台「身份认证」→「登录方式」启用「邮箱验证码登录」");
        } else {
          setError(rawMsg || "发送验证码失败");
        }
      }
    } finally {
      setCodeSending(false);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!verificationId) {
      setError("请先获取验证码");
      return;
    }

    if (!verificationCode.trim()) {
      setError("请输入验证码");
      return;
    }

    // 新用户注册时才校验这些字段
    if (!isExistingUser) {
      if (!name.trim() || !username.trim() || !password.trim()) {
        setError("请填写所有必填项");
        return;
      }

      const uname = username.trim().toLowerCase(); // CloudBase 要求用户名必须小写
      // CloudBase 要求：^[a-z][0-9a-z_-]{5,24}$ = 第一个小写字母 + 后面5-24个字符 = 总共6-25个字符
      if (uname.length < 6 || uname.length > 25) {
        setError("用户名为 6-25 位");
        return;
      }
      // CloudBase 要求：必须以小写字母开头，只能包含小写字母、数字、下划线和短横线
      if (!/^[a-z][0-9a-z_-]{5,24}$/.test(uname)) {
        setError("用户名必须以小写字母开头，6-25 位，只能包含小写字母、数字、下划线和短横线");
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
    }

    startTransition(async () => {
      const auth = getCloudbaseAuth();
      if (!auth) {
        setError("CloudBase 未配置：请检查 NEXT_PUBLIC_CLOUDBASE_* 环境变量与控制台配置");
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

        // 如果账号已注册，则走登录；否则走注册（注册成功后会自动登录）
        if (isExistingUser) {
          await auth.signIn({
            username: registerMethod === "phone" ? normalizedPhone : normalizedEmail,
            verification_token: verificationToken,
          });
        } else {
          const payload: any = {
            verification_code: verificationCode.trim(),
            verification_token: verificationToken,
          };

          // 根据注册方式设置 phone_number 或 email
          if (registerMethod === "phone") {
            payload.phone_number = normalizedPhone;
          } else {
            payload.email = normalizedEmail;
          }

          const uname = username.trim().toLowerCase(); // CloudBase 要求用户名必须小写
          const pwd = password.trim();
          const nick = name.trim();

          if (pwd) payload.password = pwd;
          // CloudBase 要求：^[a-z][0-9a-z_-]{5,24}$ = 第一个小写字母 + 后面5-24个字符 = 总共6-25个字符
          if (uname && /^[a-z][0-9a-z_-]{5,24}$/.test(uname)) {
            payload.username = uname;
          } else if (uname) {
            // 如果用户名不符合要求，不发送 username 字段（CloudBase 允许不传）
            console.warn("用户名不符合 CloudBase 要求，将不发送 username 字段:", uname);
          }
          if (nick) payload.name = nick;

          console.log("发送给 CloudBase 的注册 payload:", JSON.stringify(payload, null, 2));
          await auth.signUp(payload);
        }

        router.replace("/cloudbase/dashboard");
      } catch (err: unknown) {
        // 详细错误日志 - 输出所有可能的错误信息
        console.error("注册失败 - 完整错误对象:", err);
        console.error("错误对象类型:", typeof err);
        console.error("错误对象键:", err && typeof err === "object" ? Object.keys(err) : []);
        console.error("错误对象 JSON:", JSON.stringify(err, null, 2));
        
        const errObj = err && typeof err === "object" ? err as any : null;
        
        // 尝试从多个可能的字段提取错误信息
        const rawMsg = 
          errObj?.message || 
          errObj?.error?.message || 
          errObj?.error || 
          errObj?.msg ||
          errObj?.errorMessage ||
          errObj?.data?.message ||
          errObj?.data?.error ||
          errObj?.response?.data?.message ||
          errObj?.response?.data?.error ||
          String(err || "");
        
        const code = 
          errObj?.code || 
          errObj?.error?.code || 
          errObj?.errorCode ||
          errObj?.data?.code ||
          errObj?.response?.data?.code ||
          "";
        
        const status = 
          errObj?.status || 
          errObj?.statusCode || 
          errObj?.response?.status ||
          errObj?.response?.statusCode ||
          "";
        
        // 构建详细错误信息
        let errorMessage = rawMsg || "注册失败（未知错误）";
        if (code) errorMessage += ` [错误码: ${code}]`;
        if (status) errorMessage += ` [HTTP: ${status}]`;
        
        // 如果错误信息为空，尝试显示错误对象的字符串表示
        if (!rawMsg || rawMsg === "{}" || rawMsg === "[object Object]") {
          errorMessage = `注册失败，请检查：\n1. CloudBase 控制台是否启用了${registerMethod === "phone" ? "手机号" : "邮箱"}验证码登录\n2. 验证码是否正确\n3. 用户名和密码是否符合要求\n\n错误详情: ${JSON.stringify(errObj || err)}`;
        }

        if (registerMethod === "phone") {
          if (rawMsg.includes("provider phone not found") || rawMsg.includes("phone not found")) {
            setError("手机号验证码注册未启用：请在云开发控制台「身份认证」→「登录方式」启用「手机号验证码登录」（上海地域）");
          } else if (rawMsg.includes("failed_precondition") || rawMsg.includes("already registered") || rawMsg.includes("already exists")) {
            setError("该手机号已被注册，请直接登录（或使用验证码登录）");
          } else if (rawMsg.includes("invalid") || rawMsg.includes("Invalid")) {
            setError(`参数错误: ${rawMsg}`);
          } else {
            setError(errorMessage);
          }
        } else {
          if (rawMsg.includes("provider email not found") || rawMsg.includes("email not found")) {
            setError("邮箱验证码注册未启用：请在云开发控制台「身份认证」→「登录方式」启用「邮箱验证码登录」");
          } else if (rawMsg.includes("failed_precondition") || rawMsg.includes("already registered") || rawMsg.includes("already exists")) {
            setError("该邮箱已被注册，请直接登录（或使用验证码登录）");
          } else if (rawMsg.includes("invalid") || rawMsg.includes("Invalid")) {
            setError(`参数错误: ${rawMsg}`);
          } else {
            setError(errorMessage);
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">注册</h1>
            <p className="mt-2 text-slate-500">
              使用手机号或邮箱验证码注册
            </p>
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

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            {step === "input" ? (
              <form onSubmit={handleGetCode} className="space-y-5">
                {/* 注册方式选择 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    注册方式
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRegisterMethod("phone");
                        setPhone("");
                        setEmail("");
                        setError("");
                      }}
                      className={`py-3 px-4 rounded-xl border-2 transition-all font-medium ${
                        registerMethod === "phone"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      手机号
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRegisterMethod("email");
                        setPhone("");
                        setEmail("");
                        setError("");
                      }}
                      className={`py-3 px-4 rounded-xl border-2 transition-all font-medium ${
                        registerMethod === "email"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      邮箱
                    </button>
                  </div>
                </div>

                {/* 手机号输入 */}
                {registerMethod === "phone" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      注册手机号
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      placeholder="请输入手机号（11位）"
                      disabled={codeSending}
                      required
                      pattern="[0-9]{11}"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      系统将自动按中国大陆格式转换为 +86 手机号（不含空格）。
                    </p>
                  </div>
                )}

                {/* 邮箱输入 */}
                {registerMethod === "email" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      注册邮箱
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="请输入邮箱地址"
                      disabled={codeSending}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      验证码将发送到您的邮箱，请查收。
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={codeSending}
                  className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {codeSending ? "发送中..." : "获取验证码"}
                </button>

                <div className="text-center text-sm text-slate-600">
                  已有账号？
                  <button
                    type="button"
                    onClick={() => router.push("/cloudbase/login")}
                    className="ml-1 font-bold text-primary hover:opacity-90"
                  >
                    去登录
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      手机号
                    </label>
                    <input
                      type="text"
                      value={normalizedPhone}
                      disabled
                      className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("input");
                      setVerificationCode("");
                      setVerificationId(null);
                      setIsExistingUser(null);
                      setError("");
                    }}
                    className="mt-6 text-sm font-medium text-primary hover:opacity-90"
                  >
                    更换
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    验证码
                  </label>
                  <input
                    type="text"
                    inputMode={registerMethod === "phone" ? "numeric" : "text"}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder={registerMethod === "phone" ? "请输入 6 位验证码" : "请输入邮箱验证码"}
                    disabled={isPending}
                    required
                    maxLength={registerMethod === "phone" ? 6 : 20}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  />
                </div>

                {!isExistingUser && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">姓名</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="请输入姓名"
                      disabled={isPending}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    />
                  </div>
                )}

                {!isExistingUser && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">用户名</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      placeholder="6-25 位，必须以小写字母开头"
                      disabled={isPending}
                      required
                      minLength={6}
                      maxLength={25}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      必须以小写字母开头，6-25 位，只能包含小写字母、数字、下划线和短横线（例如：lokada001）
                    </p>
                  </div>
                )}

                {!isExistingUser && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="至少 6 位"
                        disabled={isPending}
                        required
                        minLength={6}
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
                )}

                {!isExistingUser && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      确认密码
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="请再次输入密码"
                      disabled={isPending}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (isExistingUser ? "登录中..." : "注册中...") : (isExistingUser ? "验证并登录" : "完成注册")}
                </button>

                <div className="text-center text-sm text-slate-600">
                  已有账号？
                  <button
                    type="button"
                    onClick={() => router.push("/cloudbase/login")}
                    className="ml-1 font-bold text-primary hover:opacity-90"
                  >
                    去登录
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

