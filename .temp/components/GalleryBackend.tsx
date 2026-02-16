
import React, { useState, useRef } from 'react';
import { ImageAsset } from '../types';

interface GalleryBackendProps {
  images: ImageAsset[];
  onBack: () => void;
  onRemove: (id: string) => void;
  onFileUpload: (file: File) => void;
}

const GalleryBackend: React.FC<GalleryBackendProps> = ({ images, onBack, onRemove, onFileUpload }) => {
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />
      
      <header className="h-20 border-b border-slate-100 px-8 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="size-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">图片资产中心</h1>
            <p className="text-xs text-slate-500">管理您生成和上传的所有设计稿</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input type="text" placeholder="搜索图片..." className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-primary/20" />
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-md shadow-primary/10"
          >
            <span className="material-symbols-outlined text-[18px]">upload</span>
            本地上传
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex gap-4">
              <button className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold shadow-md shadow-slate-900/10">全部图片 ({images.length})</button>
              <button className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-medium hover:border-primary hover:text-primary transition-all">AI 生成</button>
              <button className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-medium hover:border-primary hover:text-primary transition-all">本地上传</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {images.map((img) => (
              <div key={img.id} className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                <div 
                  className="aspect-[3/4] relative overflow-hidden bg-slate-200 cursor-zoom-in"
                  onClick={() => setSelectedImage(img)}
                >
                  <img src={img.url} alt={img.alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <div className="size-9 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg">
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(img.id);
                      }} 
                      className="size-9 rounded-full bg-white text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
                <div className="p-4 border-t border-slate-50">
                  <p className="text-xs font-bold text-slate-800 truncate">{img.alt}</p>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                    {new Date(img.timestamp).toLocaleDateString()} 保存
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Lightbox / Enlarged View Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <div className="h-20 px-8 flex items-center justify-between text-white shrink-0">
            <div className="flex flex-col">
              <span className="text-sm font-bold truncate max-w-md">{selectedImage.alt}</span>
              <span className="text-[10px] opacity-60">保存于 {new Date(selectedImage.timestamp).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined">download</span>
              </button>
              <button 
                onClick={() => setSelectedImage(null)}
                className="size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 md:p-12 overflow-hidden">
            <img 
              src={selectedImage.url} 
              alt={selectedImage.alt} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryBackend;
