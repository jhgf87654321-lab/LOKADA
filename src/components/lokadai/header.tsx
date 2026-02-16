"use client";

import React, { useState } from 'react';
import { useSession, signOut } from '@/lib/auth/client';
import { Icons } from './material-icon';

interface HeaderProps {
  onStartTrial: () => void;
  onOpenCreations?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onStartTrial, onOpenCreations }) => {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowDropdown(false);
  };

  const isLoggedIn = !!session?.user;

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
          <a className="text-sm font-medium hover:text-primary transition-colors" href="#">首页</a>
          <a className="text-sm font-bold text-primary border-b-2 border-primary pb-1" href="#">产品开发服务</a>
          <a className="text-sm font-medium hover:text-primary transition-colors" href="#">工服定制 AI</a>
          <a className="text-sm font-medium hover:text-primary transition-colors" href="#">关于我们</a>
        </nav>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-all"
              >
                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block">
                  {session?.user?.name || '用户'}
                </span>
                <Icons.UnfoldMore className="text-slate-400 text-[18px]" />
              </button>

              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900">{session?.user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
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
            <button
              onClick={onStartTrial}
              className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              免费试用
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
