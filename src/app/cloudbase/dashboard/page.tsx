"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCloudbaseAuth } from "@/lib/cloudbase";

type UserInfo = {
  uid: string;
  username?: string;
  phoneNumber?: string;
  email?: string;
  displayName?: string;
};

function isCloudbaseLoggedIn(auth: unknown) {
  const a = auth as any;
  const hasState = a?.hasLoginState?.() ?? a?.isLoginState?.();
  const u = a?.currentUser;
  const hasIdentity = Boolean(u && (u.phoneNumber || u.email || u.username));
  return Boolean(hasState && hasIdentity);
}

export default function CloudbaseDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [user, setUser] = useState<UserInfo | null>(null);
  const syncInProgressRef = useRef(false);

  useEffect(() => {
    // 在客户端检查环境变量
    const env = process.env.NEXT_PUBLIC_CLOUDBASE_ENV;
    const clientId = process.env.NEXT_PUBLIC_CLOUDBASE_CLIENT_ID;
    const region = process.env.NEXT_PUBLIC_CLOUDBASE_REGION;
    
    console.log("[CloudBase Dashboard] 环境变量检查:", {
      env,
      clientId,
      region,
      hasWindow: typeof window !== "undefined",
    });
    
    const auth = getCloudbaseAuth();
    if (!auth) {
      let errorMsg = "CloudBase 未配置：";
      if (!env || !clientId) {
        errorMsg += `请检查环境变量配置\n`;
        errorMsg += `- NEXT_PUBLIC_CLOUDBASE_ENV: ${env || "未设置"}\n`;
        errorMsg += `- NEXT_PUBLIC_CLOUDBASE_CLIENT_ID: ${clientId || "未设置"}\n`;
        errorMsg += `- NEXT_PUBLIC_CLOUDBASE_REGION: ${region || "未设置"}\n\n`;
        errorMsg += `提示：\n`;
        errorMsg += `1. 本地开发：检查 .env 文件，确保变量以 NEXT_PUBLIC_ 开头，然后重启开发服务器\n`;
        errorMsg += `2. 生产环境：在 CloudBase 控制台 → 云托管 → 配置 → 环境变量中设置\n`;
        errorMsg += `3. 修改环境变量后需要重启开发服务器或重新部署`;
      } else {
        errorMsg += "未知错误，请查看浏览器控制台";
      }
      setError(errorMsg);
      setLoading(false);
      return;
    }

    const sync = async () => {
      if (syncInProgressRef.current) return;
      syncInProgressRef.current = true;
      try {
        if (!isCloudbaseLoggedIn(auth)) {
          setUser(null);
          setLoading(false);
          return;
        }
        const current = await auth.getCurrentUser();
        if (!current) {
          setUser(null);
          setLoading(false);
          return;
        }
        const uid = (current as any)?.uid;
        if (!uid) {
          setUser(null);
          setLoading(false);
          return;
        }
        setUser({
          uid: String(uid),
          username: (current as any).username,
          phoneNumber: (current as any).phoneNumber,
          email: (current as any).email,
          displayName: (current as any).displayName,
        });
      } catch (e: unknown) {
        const msg =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: string }).message)
            : "获取用户信息失败";
        setError(msg);
      } finally {
        setLoading(false);
        syncInProgressRef.current = false;
      }
    };

    sync();
    const unsubscribe =
      (auth as any).onLoginStateChange?.(() => sync()) ??
      (auth as any).onLoginStateChanged?.(() => sync());
    return () => {
      try {
        unsubscribe?.();
      } catch {
        // ignore
      }
    };
  }, []);

  const signOut = async () => {
    const auth = getCloudbaseAuth();
    if (!auth) return;
    try {
      await Promise.race([
        auth.signOut(),
        new Promise<void>((resolve) => setTimeout(resolve, 1500)),
      ]);
    } catch (e) {
      console.error("退出登录失败:", e);
    }
    router.replace("/");
  };

  return (
    <div className="min-h-[100svh] bg-background-light font-display flex flex-col">
      <div className="max-w-[1440px] mx-auto w-full px-6 pt-8 flex items-center justify-between gap-4">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          返回首页
        </a>

        {user && (
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            退出登录
          </button>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            {loading ? (
              <div className="text-slate-500">加载中...</div>
            ) : !user ? (
              <div className="text-center py-4">
                <div className="size-16 mx-auto mb-4 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px]">person_off</span>
                </div>
                <p className="text-slate-700 font-medium">您尚未登录</p>
                <p className="text-slate-500 text-sm mt-2">请先登录后再查看用户中心</p>
                <Link
                  href="/cloudbase/login"
                  prefetch={false}
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                >
                  去登录
                </Link>
              </div>
            ) : error ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined filled">person</span>
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">用户中心</h1>
                    <p className="text-slate-500 text-sm truncate">
                      {user?.displayName || user?.username || user?.phoneNumber || user?.email || ""}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined filled">person</span>
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">用户中心</h1>
                    <p className="text-slate-500 text-sm truncate">
                      {user?.displayName || user?.username || user?.phoneNumber || user?.email || ""}
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <InfoRow label="UID" value={user?.uid} monospace />
                  <InfoRow label="用户名" value={user?.username} />
                  <InfoRow label="手机号" value={user?.phoneNumber} />
                  <InfoRow label="邮箱" value={user?.email} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  monospace,
}: {
  label: string;
  value?: string;
  monospace?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
      <div className="text-sm font-medium text-slate-600">{label}</div>
      <div
        className={[
          "text-sm text-slate-900 truncate max-w-[70%] text-right",
          monospace ? "font-mono text-slate-700" : "",
        ].join(" ")}
        title={value || ""}
      >
        {value || "—"}
      </div>
    </div>
  );
}

