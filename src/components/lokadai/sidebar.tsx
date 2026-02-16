"use client";

import React, { useState } from 'react';
import { ImageAsset, ModelOption } from './types';
import { MaterialIcon, Icons } from './material-icon';

interface SidebarProps {
  images: ImageAsset[];
  models: ModelOption[];
  selectedModelId: string;
  onModelSelect: (id: string) => void;
  onOpenGallery: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ images, models, selectedModelId, onModelSelect, onOpenGallery }) => {
  const [enlargedImage, setEnlargedImage] = useState<ImageAsset | null>(null);

  return (
    <aside className="w-80 border-r border-slate-200 flex flex-col bg-white">
      <div className="p-5 flex flex-col gap-8 h-full custom-scrollbar overflow-y-auto">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3
              onClick={onOpenGallery}
              className="font-bold text-sm uppercase tracking-wider text-slate-500 cursor-pointer hover:text-primary flex items-center gap-2 group"
            >
              图片库
              <MaterialIcon name="open_in_new" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {images.slice(0, 3).map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square rounded-lg overflow-hidden border border-slate-100 cursor-pointer"
                onClick={() => setEnlargedImage(img)}
              >
                <img src={img.url} alt={img.alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <MaterialIcon name="zoom_in" className="text-white" />
                </div>
              </div>
            ))}
            <div
              onClick={onOpenGallery}
              className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-colors cursor-pointer"
            >
              <Icons.Collections className="" />
              <span className="text-[10px] mt-1">进入后台</span>
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-4">模型选择</h3>
          <div className="space-y-4">
            {models.map((model) => (
              <div
                key={model.id}
                onClick={() => onModelSelect(model.id)}
                className={`flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer ${
                  selectedModelId === model.id
                  ? 'bg-primary/10 border-primary/20 ring-1 ring-primary/20'
                  : 'hover:bg-slate-50 border-transparent'
                }`}
              >
                <img src={model.avatar} alt={model.name} className={`size-12 rounded-full object-cover ${selectedModelId === model.id ? 'border-2 border-primary' : ''}`} />
                <div>
                  <p className="text-sm font-semibold">{model.name}</p>
                  <p className="text-xs text-slate-500">{model.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Enlarged Image Lightbox */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-200"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-full flex items-center justify-center group">
            <button
              className="absolute -top-12 right-0 text-white hover:text-primary transition-colors flex items-center gap-2 text-sm font-medium"
              onClick={() => setEnlargedImage(null)}
            >
              <Icons.Close />
              关闭
            </button>
            <img
              src={enlargedImage.url}
              alt={enlargedImage.alt}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute -bottom-12 left-0 right-0 text-center text-white/80 text-sm">
              {enlargedImage.alt}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
