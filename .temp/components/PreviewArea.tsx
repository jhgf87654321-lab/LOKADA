
import React, { useState } from 'react';
import { DesignState } from '../types';

interface PreviewAreaProps {
  designState: DesignState;
  onAddToGallery: () => void;
  isAdded: boolean;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({ designState, onAddToGallery, isAdded }) => {
  const [sliderValue, setSliderValue] = useState(50);

  return (
    <section className="w-[450px] border-l border-slate-200 bg-slate-50 flex flex-col">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
        <h2 className="font-bold text-sm">主图展示区 (实时预览)</h2>
        <div className="flex gap-2">
          <button className="size-8 rounded-lg bg-white flex items-center justify-center border border-slate-200 text-slate-500 hover:text-primary transition-colors" title="下载设计">
            <span className="material-symbols-outlined text-sm">download</span>
          </button>
          <button className="size-8 rounded-lg bg-white flex items-center justify-center border border-slate-200 text-slate-500 hover:text-primary transition-colors" title="分享设计">
            <span className="material-symbols-outlined text-sm">share</span>
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
            <div className="absolute inset-0 w-[400px]"> {/* Match aspect ratio container width approximately */}
              <img 
                className="w-full h-full object-cover max-w-none grayscale opacity-70" 
                src={designState.beforeUrl} 
                alt="Before Design"
                style={{ width: '400px', height: '100%' }} // Fixed size relative to container
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
              <span className="material-symbols-outlined text-primary text-xl font-bold animate-pulse">unfold_more</span>
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
            <span className="material-symbols-outlined text-[18px]">
              {isAdded ? 'check_circle' : 'library_add'}
            </span>
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
          <span className="material-symbols-outlined">rocket_launch</span>
          生成生产级物料单
        </button>
      </div>
    </section>
  );
};

export default PreviewArea;
