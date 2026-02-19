"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCloudbaseAuth } from "@/lib/cloudbase";
import { Icons } from "./material-icon";

interface CloudbaseAuthPageProps {
  onBack: () => void;
}

type AuthMode = 'login' | 'register';

function isCloudbaseLoggedIn(auth: unknown) {
  const a = auth as any;
  const hasState = a?.hasLoginState?.() ?? a?.isLoginState?.();
  const u = a?.currentUser;
  const hasIdentity = Boolean(u && (u.phoneNumber || u.email || u.username));
  return Boolean(hasState && hasIdentity);
}

export default function CloudbaseAuthPage({ onBack }: CloudbaseAuthPageProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");

  // Check if already logged in
  useEffect(() => {
    const auth = getCloudbaseAuth();
    if (isCloudbaseLoggedIn(auth)) {
      router.push('/');
    }
  }, [router]);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6">
      <button
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-primary transition-colors"
      >
        <Icons.ArrowBack />
        返回首页
      </button>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center size-16 bg-primary/10 text-primary rounded-2xl mb-4">
            <svg className="size-10" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z" fill="currentColor"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {mode === 'login' ? '欢迎回来' : '创建账号'}
          </h2>
          <p className="mt-2 text-slate-500">
            {mode === "login"
              ? "前往 CloudBase 登录页面"
              : "前往 CloudBase 手机号验证码注册页面"}
          </p>
        </div>
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => router.push("/cloudbase/login")}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
          >
            去登录
          </button>
          <button
            type="button"
            onClick={() => router.push("/cloudbase/register")}
            className="w-full py-4 bg-white border border-slate-200 text-slate-800 font-bold rounded-xl hover:bg-slate-50 transition-all"
          >
            去注册（手机号验证码）
          </button>
        </div>

        <div className="text-center">
          {mode === 'login' ? (
            <button
              onClick={() => setMode('register')}
              className="text-sm font-medium text-primary hover:underline"
            >
              还没有账号？点击注册
            </button>
          ) : (
            <button
              onClick={() => setMode('login')}
              className="text-sm font-medium text-primary hover:underline"
            >
              已有账号？点击登录
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
