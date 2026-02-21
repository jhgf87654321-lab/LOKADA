"use client";

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from "next/navigation";
import { SITE_HOME_URL, ABOUT_URL } from "@/lib/constants";
import { getCloudbaseAuth } from '@/lib/cloudbase';
import { Icons } from './material-icon';

interface HeaderProps {
  onOpenCreations?: () => void;
}

/**
 * 检查 CloudBase 登录状态（异步版本）
 * 符合 CloudBase Web SDK 2.24.0+ 规范：使用 getUser() 和 getSession()
 */
async function isCloudbaseLoggedIn(auth: any): Promise<boolean> {
  if (!auth) return false;
  try {
    // 先检查会话
    const { data: sessionData } = await auth.getSession();
    if (!sessionData?.session) return false;
    
    // 再检查用户信息
    const { data: userData } = await auth.getUser();
    if (!userData?.user) return false;
    
    const user = userData.user;
    // 确保不是匿名用户
    if (user.is_anonymous) return false;
    
    // 确保有有效的用户标识
    return Boolean(user.id && (user.email || user.phone || user.user_metadata?.username));
  } catch {
    return false;
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
    if (!auth) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Check Cloudbase auth state
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // 符合 CloudBase Web SDK 2.24.0+ 规范：先检查登录状态
        const loggedIn = await isCloudbaseLoggedIn(auth);
        
        if (!loggedIn) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        // 如果已登录，获取用户详细信息
        const { data: userData, error: userError } = await Promise.race([
          auth.getUser(),
          new Promise<{ data: null; error: { message: string } }>((resolve) => 
            setTimeout(() => resolve({ data: null, error: { message: "timeout" } }), 1500)
          ),
        ]);
        
        if (!userError && userData?.user) {
          const user = userData.user;
          // 再次确认不是匿名用户
          if (user.is_anonymous) {
            setUser(null);
            setIsLoading(false);
            return;
          }
          
          // 确保有有效的用户 ID
          if (!user.id) {
            setUser(null);
            setIsLoading(false);
            return;
          }
          
          setUser({
            uid: String(user.id), // CloudBase Web SDK 2.24.0+ 使用 user.id
            email: user.email || '',
            displayName: user.user_metadata?.nickName || user.user_metadata?.name || user.email?.split('@')[0] || user.user_metadata?.username || '用户'
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // 初始检查
    void checkAuth();

    // 符合 CloudBase Web SDK 2.24.0+ 规范：使用 onAuthStateChange 监听认证状态变化
    // 防抖避免 SDK 连续触发导致请求风暴
    const handler = (event: string) => {
      if (checkAuthRef.current) clearTimeout(checkAuthRef.current);
      checkAuthRef.current = setTimeout(() => {
        checkAuthRef.current = null;
        // 当退出登录时，立即清除用户状态
        if (event === "SIGNED_OUT") {
          setUser(null);
          setIsLoading(false);
          purgeCloudbaseLocalState();
        } else {
          void checkAuth();
        }
      }, 300);
    };

    // 使用新版 onAuthStateChange API
    const { data: unsubscribeData } = auth.onAuthStateChange((event, session, info) => {
      handler(event);
    });
    
    return () => {
      if (checkAuthRef.current) clearTimeout(checkAuthRef.current);
      try {
        unsubscribeData?.subscription?.unsubscribe?.();
      } catch {
        // ignore
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
    // 先更新 UI，避免 signOut 网络挂起导致"卡死"
    setShowDropdown(false);
    setUser(null);
    setIsLoading(false);

    if (auth) {
      try {
        // 符合 CloudBase Web SDK 2.24.0+ 规范：signOut()
        const result = await Promise.race([
          auth.signOut(),
          new Promise<{ error?: { message: string } }>((resolve) => 
            setTimeout(() => resolve({ error: { message: "timeout" } }), 1500)
          ),
        ]);
        
        // 检查是否有错误
        if (result && typeof result === 'object' && 'error' in result && result.error) {
          console.error("退出登录失败:", result.error);
        }
      } catch (err) {
        console.error("退出登录失败:", err);
      }
    }
    
    // 兜底清理：防止 CloudBase 本地残留导致"半退出"从而产生重定向循环
    purgeCloudbaseLocalState();
    
    // 强制清除用户状态（防止状态不同步）
    setUser(null);
    setIsLoading(false);
    
    // 退出后返回首页；若已在首页则刷新页面以清除可能的状态
    if (pathname !== "/") {
      router.replace("/");
    } else {
      // 如果在首页，强制刷新以清除可能的状态
      router.refresh();
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
