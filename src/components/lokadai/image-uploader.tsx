"use client";

import React, { useState, useCallback } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
  maxSize?: number;
  acceptedTypes?: string[];
}

export function ImageUploader({
  onUploadComplete,
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    // Reset states
    setError(null);
    setUploadProgress(0);

    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      setError('只支持 JPG, PNG, WEBP, GIF 格式的图片');
      setUploadProgress(null);
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`);
      setUploadProgress(null);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Vercel Blob
    setIsUploading(true);
    setUploadProgress(10);

    try {
      setUploadProgress(30);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'x-file-name': encodeURIComponent(file.name || 'upload'),
        },
        body: file,
      });

      setUploadProgress(70);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '上传失败');
      }

      setUploadProgress(100);

      // Small delay for visual feedback
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(null);
        onUploadComplete(data.url);
      }, 500);

    } catch (err: any) {
      setIsUploading(false);
      setUploadProgress(null);
      setError(err.message || '上传失败，请重试');
      setPreviewUrl(null);
    }
  }, [acceptedTypes, maxSize, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const clearPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setError(null);
  };

  return (
    <div className="w-full">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          relative border-2 border-dashed rounded-xl p-6
          transition-all duration-200
          ${isUploading
            ? 'border-primary/50 bg-primary/5'
            : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'
          }
        `}
      >
        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            {isUploading ? (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex flex-col items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <span className="text-sm">
                  {uploadProgress !== null ? `上传中... ${uploadProgress}%` : '上传中...'}
                </span>
              </div>
            ) : (
              <button
                onClick={clearPreview}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            {isUploading ? (
              <>
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-3" />
                <p className="text-sm text-slate-600">
                  {uploadProgress !== null ? `上传中... ${uploadProgress}%` : '上传中...'}
                </p>
              </>
            ) : (
              <>
                <div className="p-3 bg-primary/10 rounded-full mb-3">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">
                  点击或拖拽图片到这里
                </p>
                <p className="text-xs text-slate-500">
                  支持 JPG, PNG, WEBP，最大 5MB
                </p>
              </>
            )}
          </div>
        )}

        {/* Hidden file input */}
        {!isUploading && !previewUrl && (
          <input
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelect(file);
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 flex items-center gap-2">
            <span className="text-red-500">!</span>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}

// Simple inline upload button for chat area
export function UploadButton({ onUploadComplete }: { onUploadComplete: (url: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file: File) => {
    setIsUploading(true);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'x-file-name': encodeURIComponent(file.name || 'upload'),
        },
        body: file,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '上传失败');
      }

      onUploadComplete(data.url);
    } catch (err: any) {
      alert(err.message || '上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <label
      className={`
        p-2 text-slate-400 hover:text-primary transition-colors flex items-center justify-center cursor-pointer
        ${isUploading ? 'animate-pulse' : ''}
      `}
      title="上传图片"
    >
      {isUploading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <ImageIcon className="w-5 h-5" />
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFile(file);
          }
        }}
      />
    </label>
  );
}
