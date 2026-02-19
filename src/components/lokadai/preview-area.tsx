"use client";

import React, { useState } from 'react';
import { DesignState } from './types';
import { MaterialIcon, Icons } from './material-icon';

interface PreviewAreaProps {
  designState: DesignState;
  onAddToGallery: () => void;
  isAdded: boolean;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({ designState, onAddToGallery, isAdded }) => {
  const [sliderValue, setSliderValue] = useState(50);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!designState.afterUrl) {
      return;
    }

    setIsDownloading(true);
    try {
      // 使用 Canvas API 处理跨域图片下载
      const img = new Image();
      img.crossOrigin = 'anonymous'; // 允许跨域
      
      img.onload = () => {
        try {
          // 创建 canvas 并绘制图片
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('无法创建 canvas 上下文');
          }
          
          ctx.drawImage(img, 0, 0);
          
          // 将 canvas 转换为 blob
          canvas.toBlob((blob) => {
            if (!blob) {
              throw new Error('无法生成图片文件');
            }
            
            // 创建临时下载链接
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // 生成文件名（使用时间戳）
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            link.download = `lokada-design-${timestamp}.png`;
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 清理临时 URL
            window.URL.revokeObjectURL(url);
            setIsDownloading(false);
          }, 'image/png');
        } catch (error) {
          console.error('Canvas 处理失败:', error);
          // 降级方案：直接打开图片链接，让用户右键保存
          window.open(designState.afterUrl, '_blank');
          setIsDownloading(false);
        }
      };
      
      img.onerror = () => {
        console.error('图片加载失败，尝试直接下载');
        // 降级方案：直接打开图片链接
        const link = document.createElement('a');
        link.href = designState.afterUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsDownloading(false);
      };
      
      // 开始加载图片
      img.src = designState.afterUrl;
    } catch (error) {
      console.error('下载失败:', error);
      // 最后的降级方案：直接打开图片
      window.open(designState.afterUrl, '_blank');
      setIsDownloading(false);
    }
  };

  return (
    <section className="w-[450px] border-l border-slate-200 bg-slate-50 flex flex-col">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
        <h2 className="font-bold text-sm">主图展示区 (实时预览)</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleDownload}
            disabled={isDownloading || !designState.afterUrl}
            className="size-8 rounded-lg bg-white flex items-center justify-center border border-slate-200 text-slate-500 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
            title="下载设计"
          >
            <Icons.Download className={`text-sm ${isDownloading ? 'animate-pulse' : ''}`} />
          </button>
          <button className="size-8 rounded-lg bg-white flex items-center justify-center border border-slate-200 text-slate-500 hover:text-primary transition-colors" title="分享设计">
            <Icons.Share className="text-sm" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center justify-center relative">
        <div className="relative w-full aspect-[3/4] rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 group select-none">
          {/* Main After Image (Base) */}
          <img className="w-full h-full object-cover pointer-events-none" src={designState.afterUrl} alt="Updated Design" />

          {/* Overlay Image (Before) */}
          <div
            className="absolute inset-y-0 left-0 overflow-hidden border-r-[3px] border-primary z-10 shadow-[4px_0_15px_rgba(0,0,0,0.3)]"
            style={{ width: `${sliderValue}%` }}
          >
            <div className="absolute inset-0 w-[400px]">
              <img
                className="w-full h-full object-cover max-w-none grayscale opacity-70"
                src={designState.beforeUrl}
                alt="Before Design"
                style={{ width: '400px', height: '100%' }}
              />
            </div>
            <span className="absolute top-4 left-4 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap z-20">修改前</span>
          </div>

          <span className="absolute top-4 right-4 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm z-10 font-bold">修改后</span>

          {/* Invisible Range Slider for Interaction */}
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={sliderValue}
            onChange={(e) => setSliderValue(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          />

          {/* Custom Slider Handle */}
          <div
            className="absolute top-0 bottom-0 z-20 pointer-events-none flex items-center justify-center"
            style={{ left: `${sliderValue}%` }}
          >
            <div className="h-full w-[2px] bg-primary"></div>
            <div className="absolute top-1/2 -translate-y-1/2 size-10 rounded-full bg-white border-2 border-primary shadow-xl flex items-center justify-center">
              <Icons.UnfoldMore className="text-primary text-xl font-bold animate-pulse" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2 w-full">
           <button
            disabled={isAdded}
            onClick={onAddToGallery}
            className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
              isAdded
              ? 'bg-green-50 text-green-600 border-green-200'
              : 'bg-white border-slate-200 text-slate-700 hover:border-primary hover:text-primary shadow-sm'
            }`}
          >
            <MaterialIcon name={isAdded ? 'check_circle' : 'library_add'} className="text-[18px]" />
            {isAdded ? '已加入图片库' : '加入图片库'}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 w-full">
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
            <p className="text-[10px] text-slate-500 uppercase font-bold">面料材质</p>
            <p className="text-xs font-medium text-slate-900">{designState.material}</p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
            <p className="text-[10px] text-slate-500 uppercase font-bold">配色方案</p>
            <p className="text-xs font-medium text-slate-900">{designState.colorScheme}</p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-100/50 border-t border-slate-200">
        <button className="w-full py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
          <Icons.RocketLaunch />
          生成生产级物料单
        </button>
      </div>
    </section>
  );
};

export default PreviewArea;
