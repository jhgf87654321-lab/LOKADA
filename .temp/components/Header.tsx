
import React from 'react';

interface HeaderProps {
  onStartTrial: () => void;
}

const Header: React.FC<HeaderProps> = ({ onStartTrial }) => {
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
          <button 
            onClick={onStartTrial}
            className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            免费试用
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
