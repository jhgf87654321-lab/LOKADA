"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Role, Message, ImageAsset, DesignState, ModelOption, ViewState } from './types';
import Header from './header';
import Sidebar from './sidebar';
import ChatArea from './chat-area';
import PreviewArea from './preview-area';
import GalleryBackend from './gallery-backend';
import MyCreations from './my-creations';
import { getCloudbaseAuth } from '@/lib/cloudbase';

const INITIAL_IMAGES: ImageAsset[] = [
  { id: '1', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdgJBcXeB3Zkito5LZSDl04gElAhWN-7GSdGwZryHkxZogwHjEC45zD3LqOpf61h9krLI_T2s4HlewL1feGuzvUMDXXD7lsr64bcOoLEGdnC_Dh9olqFbcaRnNq-bDxEoTURXypS_AtueJzibCBJ-ZImYDS8aGG5nBQ8uyxb3LZo99rmU0RKPa7PrpLRWlvspNAXW4vzN_-6fFRfxfkZUuKig4yKL-oN37fIHH3zRp-OvGYfS59Fayi_DAL2af41tNFdvrr6ZBUPNL', alt: '深蓝色夹克设计稿', timestamp: Date.now() - 1000000 },
  { id: '2', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDHeYw0Hsb6kHCHyzN4plCFqk5dIFaepOvXgklAnJmw0GywAQD2P8ayyS8zDfOcfivnXI7iKJDlh7STRjZGEU3CkpQDWEdpRZU3iVeA1jPNzBpeePoC_Qkh2Q1O3MXAICqaSpk15oyZre1QjFBYk_ihRbZmMYbh-BAUSqn0NCWBtEMDoZC9UclsClbA-yRRu3U2p50yjx7QaV0f8wkg2NcwYJIWLFRh-hiRlnW7FoAm3pg8-72mOLMyimXBzXiLQDYsYLjny8S8AAn', alt: '白色 T 恤基础样稿', timestamp: Date.now() - 5000000 },
  { id: '3', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrLUQ-_JrrRZrW1CcG3VUZkBXgoM5tx4KPzw4SHmSMOvVOcWf5MV4G-hgyjDyvygRxnwBsv_1KwYZXM9OmNIrpwMuwdVEBtUdwS7AyS8dJkuVo88ZciYG6PwubCLS-Sem3TzEML3N3kkwFXjwfP9iLGU9ru_bUT-dfbPqISHvrGMxhGNBCQ1LKp6hu3GCGMiUMcdMqACAkowQqKCYWN2Xq1ru2CkggEEY1gHIrLPguc5UP03jWSIH6e6QauQozOT-cSRpKao0gqpiF', alt: '反光背心安全服', timestamp: Date.now() - 10000000 },
];

const INITIAL_DESIGN: DesignState = {
  beforeUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmT5LVObApJ4cJVtYS31_G5mLj6SIB-K5aX2EctPWVuIhnd25wDSEjx30RX3r6vzEvA-ri2xxtRB6pb32PeifZwg_9JJ_bHp1EzgN0cWkb_jNPxLz3EGuPHMKV7tnMj1Ph9yM4jtxgxUEEo7O71d97xbRN3WeJQDcaZYIOtO9JMumFo8PAEqpaewfGbZGPWLlrHtB3_2qbXClrRIZ95bjdduiPbTo3Bbd1r1kFKDI2Yyc8SXWcSAMbfT__Q56EFkpo2vtcYqwHvNbK',
  afterUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCohsuoXIV52pYwuk7sDmuDAeSHVX87cIe5l_bmJbGiLiMLGc62MnXhusw-QnDZ5lteRbZE3Wr-z8qHCmoxUCLXGM-04i2hyvYX0Tsa1zwmS_JJ1EXrS7qiFhSUnAwpTtefZPZkssilq1FmomW5fda0bootzNOAZCERaulIev9EA2s_1lc15bWH3qknSpqeEAdVinV4XT1iYmrL6EZ--lx0r9czhEN7l5Hc1P4frML4UKT-jgS3dBx2KPyPJwcd7HPXN2f4xCIKHYWH',
  material: '重磅帆布 / 防水涂层',
  colorScheme: '深灰色 (Pantone 19-3906)'
};

const MODELS: ModelOption[] = [
  { id: 'flux', name: 'Flux.1 [dev]', description: '高保真图像生成', avatar: 'https://picsum.photos/id/64/100/100' },
  { id: 'banana', name: 'Nano Banana', description: '创意视觉增强', avatar: 'https://picsum.photos/id/65/100/100' },
  { id: 'qwen', name: 'Qwen-VL', description: '多模态语义理解', avatar: 'https://picsum.photos/id/66/100/100' },
];

// 检查 CloudBase 登录状态
function isCloudbaseLoggedIn(auth: unknown) {
  const a = auth as any;
  if (!a) return false;
  try {
    const state = a.getLoginState?.();
    if (!state) return false;
    const provider = state.credential?.provider;
    if (provider && String(provider).toLowerCase() === "anonymous") {
      return false;
    }
    const user = state.user || a.currentUser;
    const hasIdentity = Boolean(user && (user.phoneNumber || user.email || user.username));
    return hasIdentity;
  } catch {
    return Boolean(a?.hasLoginState?.() ?? a?.isLoginState?.());
  }
}

/**
 * 确保 CloudBase 已登录
 * 符合 CloudBase Web SDK 2.24.0+ 规范：使用 getUser() 和 getSession()
 */
async function ensureCloudbaseLoggedIn(): Promise<boolean> {
  const auth = getCloudbaseAuth();
  if (!auth) return false;
  
  try {
    // 检查会话
    const { data: sessionData } = await Promise.race([
      auth.getSession(),
      new Promise<{ data: null }>((resolve) => setTimeout(() => resolve({ data: null }), 1200)),
    ]);
    if (!sessionData?.session) return false;
    
    // 检查用户信息
    const { data: userData } = await Promise.race([
      auth.getUser(),
      new Promise<{ data: null }>((resolve) => setTimeout(() => resolve({ data: null }), 1200)),
    ]);
    if (!userData?.user) return false;
    
    const user = userData.user;
    return Boolean(user.email || user.phone || user.user_metadata?.username);
  } catch {
    return false;
  }
}

// Generation task type
interface GenerationTask {
  id: string;
  status: string;
  prompt: string | null;
  originalImageUrl: string | null;
  generatedImageUrl: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('main');
  const [galleryImages, setGalleryImages] = useState<ImageAsset[]>(INITIAL_IMAGES);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: Role.MODEL,
      text: "您好！我是 LOKADA AI 设计助手。我已经准备好协助您进行产品开发。您可以上传设计图，或者描述您想要的工装细节。",
      suggestions: ["将配色改为藏蓝色", "侧边增加高亮反光条", "尝试轻量化透气面料"]
    }
  ]);
  const [designState, setDesignState] = useState<DesignState>(INITIAL_DESIGN);
  const [selectedModel, setSelectedModel] = useState<string>('flux');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isCurrentAdded, setIsCurrentAdded] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Polling for task status
  const pollTaskStatus = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(`/api/generate/${taskId}`);
      const data = await response.json();

      if (data.task) {
        const task = data.task;

        if (task.status === 'completed' && task.generatedImageUrl) {
          // Task completed
          setIsGenerating(false);

          const newImg: ImageAsset = {
            id: taskId,
            url: task.generatedImageUrl,
            alt: task.prompt || 'AI 生成图片',
            timestamp: Date.now()
          };

          setGalleryImages(prev => [newImg, ...prev]);
          setDesignState(prev => ({
            ...prev,
            beforeUrl: uploadedImageUrl || prev.afterUrl,
            afterUrl: task.generatedImageUrl
          }));

          setMessages(prev => [...prev, {
            role: Role.MODEL,
            text: "图片已生成完成！您可以在右侧预览生成的图片。"
          }]);

          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        } else if (task.status === 'failed') {
          setIsGenerating(false);
          setMessages(prev => [...prev, {
            role: Role.MODEL,
            text: `图片生成失败：${task.failMessage || '未知错误'}`
          }]);

          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, [uploadedImageUrl]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const handleSendMessage = useCallback(async (text: string) => {
    // 检查登录状态
    const ok = await ensureCloudbaseLoggedIn();
    if (!ok) {
      setMessages(prev => [...prev, {
        role: Role.MODEL,
        text: "请登录以后再进行操作"
      }]);
      return;
    }

    const userMsg: Message = { role: Role.USER, text };
    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);
    setIsCurrentAdded(false);

    try {
      // Call generation API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          prompt: text,
          originalImageUrl: uploadedImageUrl,
          aspectRatio: '1:1',
          resolution: '1K',
          outputFormat: 'png'
        })
      });

      const raw = await response.text();
      let data: any = undefined;
      try {
        data = raw ? JSON.parse(raw) : undefined;
      } catch {
        data = undefined;
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('请先登录后再使用生成功能');
        }
        const errMsg =
          (data && typeof data === 'object' ? (data.error ?? data.message) : undefined) ??
          (raw || undefined) ??
          `请求失败 (${response.status})`;
        throw new Error(`[${response.status}] ${String(errMsg)}`);
      }

      if (data && data.success && data.taskId) {
        setCurrentTaskId(data.taskId);

        setMessages(prev => [...prev, {
          role: Role.MODEL,
          text: "已收到您的需求，正在创建生成任务..."
        }]);

        // Start polling
        pollingRef.current = setInterval(() => {
          pollTaskStatus(data.taskId);
        }, 3000);

        // Initial check after 3 seconds
        setTimeout(() => {
          pollTaskStatus(data.taskId);
        }, 3000);
      } else {
        const errMsg =
          (data && typeof data === 'object' ? (data.error ?? data.message) : undefined) ??
          (raw || undefined) ??
          'Failed to create generation task';
        throw new Error(String(errMsg));
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      setIsGenerating(false);
      setMessages(prev => [...prev, {
        role: Role.MODEL,
        text: `生成失败：${error.message || '请稍后重试'}`
      }]);
    }
  }, [uploadedImageUrl, pollTaskStatus]);

  const handleFileUpload = async (file: File) => {
    // 检查登录状态
    const ok = await ensureCloudbaseLoggedIn();
    if (!ok) {
      setMessages(prev => [...prev, {
        role: Role.MODEL,
        text: "请登录以后再进行操作"
      }]);
      return;
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'x-file-name': encodeURIComponent(file.name || 'upload'),
        },
        body: file,
      });

      const raw = await response.text();
      let data: any = undefined;
      try {
        data = raw ? JSON.parse(raw) : undefined;
      } catch {
        data = undefined;
      }

      if (!response.ok) {
        const errMsg =
          (data && typeof data === 'object' ? (data.error ?? data.message) : undefined) ??
          (raw || undefined) ??
          '上传失败';
        throw new Error(`[${response.status}] ${String(errMsg)}`);
      }

      const url = data?.url;
      if (typeof url !== 'string' || !url) {
        throw new Error('上传失败：未返回 url');
      }
      const newImg: ImageAsset = {
        id: Date.now().toString(),
        url: url,
        alt: `上传图: ${file.name}`,
        timestamp: Date.now()
      };
      setGalleryImages(prev => [newImg, ...prev]);
      setDesignState(prev => ({ ...prev, afterUrl: url }));
      setUploadedImageUrl(url);
      setMessages(prev => [...prev, { role: Role.USER, text: `已上传文件: ${file.name}` }]);
      setIsCurrentAdded(true);
    } catch (error: any) {
      console.error('Upload error:', error);
      setMessages(prev => [...prev, {
        role: Role.MODEL,
        text: `上传失败：${error.message || '请稍后重试'}`
      }]);
    }
  };

  const handleAddToGallery = () => {
    if (isCurrentAdded) return;
    const newAsset: ImageAsset = {
      id: Date.now().toString(),
      url: designState.afterUrl,
      alt: `AI 生成: ${designState.colorScheme} ${designState.material}`,
      timestamp: Date.now()
    };
    setGalleryImages(prev => [newAsset, ...prev]);
    setIsCurrentAdded(true);
  };

  const removeFromGallery = (id: string) => {
    setGalleryImages(prev => prev.filter(img => img.id !== id));
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light font-display">
      <Header onOpenCreations={() => setView('creations')} />

      <main className="flex flex-1 overflow-hidden">
        <Sidebar
          images={galleryImages}
          models={MODELS}
          selectedModelId={selectedModel}
          onModelSelect={setSelectedModel}
          onOpenGallery={() => setView('gallery')}
        />
        <ChatArea
          messages={messages}
          onSendMessage={handleSendMessage}
          isGenerating={isGenerating}
          onFileUpload={handleFileUpload}
        />
        <PreviewArea
          designState={designState}
          onAddToGallery={handleAddToGallery}
          isAdded={isCurrentAdded}
        />
      </main>

      {view === 'gallery' && (
        <GalleryBackend
          images={galleryImages}
          onBack={() => setView('main')}
          onRemove={removeFromGallery}
          onFileUpload={handleFileUpload}
        />
      )}

      {view === 'creations' && (
        <MyCreations
          onBack={() => setView('main')}
        />
      )}
    </div>
  );
};

export default App;
