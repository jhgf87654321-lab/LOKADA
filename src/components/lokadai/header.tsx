"use client";

import React, { useState, useEffect } from 'react';
import { getCloudbaseAuth } from '@/lib/cloudbase';
import { Icons } from './material-icon';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenCreations?: () => void;
}

interface CloudbaseUser {
  uid: string;
  email?: string;
  displayName?: string;
}

const Header: React.FC<HeaderProps> = ({ onOpenAuth, onOpenCreations }) => {
  const [user, setUser] = useState<CloudbaseUser | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check Cloudbase auth state
    const checkAuth = () => {
      const auth = getCloudbaseAuth();
      if (auth?.isLoginState()) {
        const userInfo = auth.currentUser;
        if (userInfo) {
          setUser({
            uid: userInfo.uid,
            email: userInfo.email,
            displayName: userInfo.displayName || userInfo.email?.split('@')[0]
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    checkAuth();
    // Listen for auth state changes
    const auth = getCloudbaseAuth();
    if (auth) {
      const unsubscribe = auth.onLoginStateChange((userInfo) => {
        if (userInfo) {
          setUser({
            uid: userInfo.uid,
            email: userInfo.email,
            displayName: userInfo.displayName || userInfo.email?.split('@')[0]
          });
        } else {
          setUser(null);
        }
      });
      return () => unsubscribe();
    }
    setIsLoading(false);
  }, []);

  const handleSignOut = () => {
    const auth = getCloudbaseAuth();
    if (auth) {
      auth.signOut();
    }
    setUser(null);
    setShowDropdown(false);
  };

  if (isLoading) {
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
        </div>
      </header>
    );
  }

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
          {user ? (
            <div className="relative">
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
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  />
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
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-primary transition-colors"
              >
                登录
              </button>
              <button
                onClick={onOpenAuth}
                className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                注册
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
