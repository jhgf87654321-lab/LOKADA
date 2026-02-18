"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCloudbaseAuth } from '@/lib/cloudbase';
import { Icons } from './material-icon';

interface CloudbaseAuthPageProps {
  onBack: () => void;
}

type AuthMode = 'login' | 'register';

export default function CloudbaseAuthPage({ onBack }: CloudbaseAuthPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Check if already logged in
  useEffect(() => {
    const auth = getCloudbaseAuth();
    if (auth?.isLoginState()) {
      router.push('/');
      router.refresh();
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginPhone.trim() || !loginPassword.trim()) {
      setError('请填写手机号和密码');
      return;
    }

    startTransition(async () => {
      const auth = getCloudbaseAuth();
      if (!auth) {
        setError('CloudBase 未配置');
        return;
      }

      try {
        await auth.signInWithPhoneAndPassword(loginPhone.trim(), loginPassword.trim());
        startTransition(() => {
          router.push('/');
          router.refresh();
        });
      } catch (err: unknown) {
        const rawMsg = err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : '登录失败';

        if (rawMsg.includes('user not found') || rawMsg.includes('not_found')) {
          setError('用户不存在，请先注册');
          setMode('register');
        } else if (rawMsg.includes('wrong password') || rawMsg.includes('password')) {
          setError('密码错误');
        } else {
          setError(rawMsg || '登录失败');
        }
      }
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regPhone.trim() || !regPassword.trim()) {
      setError('请填写手机号和密码');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (regPassword.length < 6) {
      setError('密码长度至少为 6 位');
      return;
    }

    startTransition(async () => {
      const auth = getCloudbaseAuth();
      if (!auth) {
        setError('CloudBase 未配置');
        return;
      }

      try {
        // Create user with phone and password
        await auth.signUpWithPhoneAndPassword(regPhone.trim(), regPassword.trim());
        // Auto login after registration
        await auth.signInWithPhoneAndPassword(regPhone.trim(), regPassword.trim());
        startTransition(() => {
          router.push('/');
          router.refresh();
        });
      } catch (err: unknown) {
        const rawMsg = err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : '注册失败';

        if (rawMsg.includes('phone already exists') || rawMsg.includes('already')) {
          setError('该手机号已被注册');
        } else if (rawMsg.includes('weak password') || rawMsg.includes('password')) {
          setError('密码强度不足，请使用更复杂的密码');
        } else {
          setError(rawMsg || '注册失败');
        }
      }
    });
  };

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
            {mode === 'login' ? '登录以访问您的云端图片库' : '注册后即可使用 AI 生成功能'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {mode === 'login' ? '手机号' : '注册手机号'}
            </label>
            <input
              type="tel"
              value={mode === 'login' ? loginPhone : regPhone}
              onChange={(e) => mode === 'login' ? setLoginPhone(e.target.value) : setRegPhone(e.target.value)}
              placeholder={mode === 'login' ? '请输入手机号' : '将作为登录账号'}
              disabled={isPending}
              required
              pattern="[0-9]{11}"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={mode === 'login' ? loginPassword : regPassword}
                onChange={(e) => mode === 'login' ? setLoginPassword(e.target.value) : setRegPassword(e.target.value)}
                placeholder="请输入密码"
                disabled={isPending}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? '隐藏' : '显示'}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">确认密码</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                disabled={isPending}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? '处理中...' : (mode === 'login' ? '立即登录' : '立即注册')}
          </button>
        </form>

        <div className="text-center">
          {mode === 'login' ? (
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className="text-sm font-medium text-primary hover:underline"
            >
              还没有账号？点击注册
            </button>
          ) : (
            <button
              onClick={() => { setMode('login'); setError(''); }}
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
