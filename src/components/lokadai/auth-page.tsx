"use client";

import React, { useState } from 'react';
import { Icons } from './material-icon';
import { signIn } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';

interface AuthPageProps {
  onBack: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const response = await signIn.username({
        username,
        password,
      } as any);

      if (response.error) {
        setError(response.error.message || '用户名或密码错误');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err?.message || '发生错误，请重试');
    } finally {
      setIsPending(false);
    }
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
            欢迎回来
          </h2>
          <p className="mt-2 text-slate-500">
            登录以访问您的云端图片库
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                用户名
              </label>
              <input
                type="text"
                name="username"
                required
                className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                placeholder="请输入用户名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">密码</label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? '处理中...' : '立即登录'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => router.push('/signup')}
            className="text-sm font-medium text-primary hover:underline"
          >
            还没有账号？点击注册
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
