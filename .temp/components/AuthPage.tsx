
import React, { useState } from 'react';

interface AuthPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onBack, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6">
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined">arrow_back</span>
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
            {isLogin ? '欢迎回来' : '开启 AI 设计之旅'}
          </h2>
          <p className="mt-2 text-slate-500">
            {isLogin ? '登录以访问您的云端图片库' : '立即注册，获取免费试用额度'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); onSuccess(); }}>
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700">用户名</label>
                <input type="text" required className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="您的姓名" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700">邮箱地址</label>
              <input type="email" required className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="name@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">密码</label>
              <input type="password" required className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
            {isLogin ? '立即登录' : '创建账号'}
          </button>
        </form>

        <div className="text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {isLogin ? '还没有账号？点击注册' : '已有账号？点击登录'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
