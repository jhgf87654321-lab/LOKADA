"use client";

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from "next/navigation";
import { SITE_HOME_URL, ABOUT_URL } from "@/lib/constants";
import { getCloudbaseAuth } from '@/lib/cloudbase';
import { Icons } from './material-icon';

interface HeaderProps {
  onOpenCreations?: () => void;
}

function isCloudbaseLoggedIn(auth: unknown) {
  const a = auth as any;
  if (!a) return false;
  try {
    const state = a.getLoginState?.();
    if (!state) return false;
    const provider = state.credential?.provider;
    if (provider && String(provider).toLowerCase() === "anonymous") {
      return false;
    }
    const user = state.user || a.currentUser;
    const hasIdentity = Boolean(user && (user.phoneNumber || user.email || user.username));
    return hasIdentity;
  } catch {
    return Boolean(a?.hasLoginState?.() ?? a?.isLoginState?.());
  }
}

function purgeCloudbaseLocalState() {
  if (typeof window === "undefined") return;
  try {
    const patterns = [/tcb/i, /cloudbase/i, /access[_-]?token/i, /refresh[_-]?token/i];
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k) keys.push(k);
    }
    for (const k of keys) {
      if (patterns.some((p) => p.test(k))) {
        window.localStorage.removeItem(k);
      }
    }
  } catch {
    // ignore
  }
}

interface CloudbaseUser {
  uid: string;
  email?: string;
  displayName?: string;
}

const Header: React.FC<HeaderProps> = ({ onOpenCreations }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CloudbaseUser | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRootRef = useRef<HTMLDivElement | null>(null);
  const checkAuthRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const auth = getCloudbaseAuth();
    if (!auth) return;

    // Check Cloudbase auth state
    const checkAuth = async () => {
      // 每次检查前，立即结束 loading，避免页面“卡死”
      setIsLoading(false);
      try {
        if (isCloudbaseLoggedIn(auth)) {
          // 避免 getCurrentUser 长时间挂起导致 UI 无响应：加一个软超时
          const userInfo = await Promise.race([
            auth.getCurrentUser(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
          ]);
          if (userInfo) {
            const userData = userInfo as any;
            setUser({
              uid: userData.uid || userData.sub || '',
              email: userData.email,
              displayName: userData.displayName || userData.name || userData.email?.split('@')[0] || userData.username || '用户'
            });
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
        setUser(null);
      }
    };

    void checkAuth();

    // Listen for auth state changes，防抖避免 SDK 连续触发导致请求风暴
    const handler = () => {
      if (checkAuthRef.current) clearTimeout(checkAuthRef.current);
      checkAuthRef.current = setTimeout(() => {
        checkAuthRef.current = null;
        void checkAuth();
      }, 300);
    };

    const unsubscribe: (() => void) | undefined =
      (auth as any).onLoginStateChange?.(handler) ??
      (auth as any).onLoginStateChanged?.(handler);
    
    return () => {
      if (checkAuthRef.current) clearTimeout(checkAuthRef.current);
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (!showDropdown) return;

    const onPointerDown = (e: PointerEvent) => {
      const root = dropdownRootRef.current;
      if (!root) return;
      if (root.contains(e.target as Node)) return;
      setShowDropdown(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [showDropdown]);

  const handleSignOut = async () => {
    const auth = getCloudbaseAuth();
    // 先更新 UI，避免 signOut 网络挂起导致“卡死”
    setShowDropdown(false);
    setUser(null);

    if (auth) {
      try {
        await Promise.race([
          auth.signOut(),
          new Promise<void>((resolve) => setTimeout(resolve, 1500)),
        ]);
      } catch (err) {
        console.error("退出登录失败:", err);
      }
    }
    // 兜底清理：防止 CloudBase 本地残留导致“半退出”从而产生重定向循环
    purgeCloudbaseLocalState();
    // 退出后返回首页；若已在首页则不再执行 replace，避免触发重复请求
    if (pathname !== "/") {
      router.replace("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-primary">
            <svg className="size-7" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z" fill="currentColor"></path>
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">LOKADA AI</h1>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a className="text-sm font-medium hover:text-primary transition-colors" href={SITE_HOME_URL}>首页</a>
          <a className="text-sm font-bold text-primary border-b-2 border-primary pb-1" href="#">产品开发服务</a>
          <a className="text-sm font-medium hover:text-primary transition-colors" href="#">工服定制 AI</a>
          <a className="text-sm font-medium hover:text-primary transition-colors" href={ABOUT_URL}>关于我们</a>
        </nav>
        <div className="flex items-center gap-4">
          {user ? (
            <div ref={dropdownRootRef} className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-all"
              >
                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                  {user.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block">
                  {user.displayName || '用户'}
                </span>
                <Icons.UnfoldMore className="text-slate-400 text-[18px]" />
              </button>

              {showDropdown && (
                <>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900">{user.displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { setShowDropdown(false); onOpenCreations?.(); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <Icons.Collections className="text-[16px]" />
                      我的创作
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <Icons.Close className="text-[16px]" />
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* 用真实链接兜底：即使客户端 JS 未挂载也能跳转 */}
              <a
                href="/cloudbase/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-primary transition-colors"
              >
                {isLoading ? "加载中…" : "登录"}
              </a>
              <a
                href="/cloudbase/register"
                className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                {isLoading ? "加载中…" : "注册"}
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
