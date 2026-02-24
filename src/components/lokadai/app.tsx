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

// 预设图片 - 使用腾讯云 COS URL（国内可访问）
const INITIAL_IMAGES: ImageAsset[] = [
  { id: '1', url: 'https://lokada-1254090729.cos.ap-shanghai.myqcloud.com/预设图/蓝色夹克.png', alt: '深蓝色夹克设计稿', timestamp: Date.now() - 1000000 },
  { id: '2', url: 'https://lokada-1254090729.cos.ap-shanghai.myqcloud.com/预设图/白色T恤.png', alt: '白色 T 恤基础样稿', timestamp: Date.now() - 5000000 },
  { id: '3', url: 'https://lokada-1254090729.cos.ap-shanghai.myqcloud.com/预设图/反光背心.png', alt: '反光背心安全服', timestamp: Date.now() - 10000000 },
];

const INITIAL_DESIGN: DesignState = {
  beforeUrl: 'https://lokada-1254090729.cos.ap-shanghai.myqcloud.com/预设图/蓝色夹克.png',
  afterUrl: 'https://lokada-1254090729.cos.ap-shanghai.myqcloud.com/预设图/蓝色夹克.png',
  material: '重磅帆布 / 防水涂层',
  colorScheme: '深灰色 (Pantone 19-3906)'
};

const MODELS: ModelOption[] = [
  { id: 'flux', name: 'Flux.2 Pro', description: '高保真图像生成', avatar: 'https://picsum.photos/id/64/100/100', kieModel: 'flux-2/pro-image-to-image' },
  { id: 'banana', name: 'Nano Banana', description: '创意视觉增强', avatar: 'https://picsum.photos/id/65/100/100', kieModel: 'nano-banana-pro' },
  { id: 'qwen', name: 'Qwen-VL', description: '多模态语义理解', avatar: 'https://picsum.photos/id/66/100/100', kieModel: 'qwen/image-to-image' },
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

  // 使用 Map 管理多个任务的轮询
  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const completedTasksRef = useRef<Set<string>>(new Set()); // 记录已完成的任务
  const activeTaskIdRef = useRef<string | null>(null); // 当前正在生成的任务 ID

  // Polling for task status
  const pollTaskStatus = useCallback(async (taskId: string) => {
    // 如果任务已经处理过，跳过
    if (completedTasksRef.current.has(taskId)) {
      return;
    }

    try {
      const response = await fetch(`/api/generate/${taskId}`);
      const data = await response.json();

      if (data.task) {
        const task = data.task;

        if (task.status === 'completed' && task.generatedImageUrl) {
          // 标记任务已处理
          completedTasksRef.current.add(taskId);

          // 清除该任务的轮询
          const interval = pollingIntervalsRef.current.get(taskId);
          if (interval) {
            clearInterval(interval);
            pollingIntervalsRef.current.delete(taskId);
          }

          // Task completed - 只有当前任务才更新 isGenerating
          if (activeTaskIdRef.current === taskId) {
            setIsGenerating(false);
          }

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

          // 清除该任务的轮询
          const completedInterval = pollingIntervalsRef.current.get(taskId);
          if (completedInterval) {
            clearInterval(completedInterval);
            pollingIntervalsRef.current.delete(taskId);
          }
        } else if (task.status === 'failed') {
          // 标记任务已处理
          completedTasksRef.current.add(taskId);

          // 只有当前任务才更新 isGenerating
          if (activeTaskIdRef.current === taskId) {
            setIsGenerating(false);
          }

          setMessages(prev => [...prev, {
            role: Role.MODEL,
            text: `图片生成失败：${task.failMessage || '未知错误'}`
          }]);

          // 清除该任务的轮询
          const failedInterval = pollingIntervalsRef.current.get(taskId);
          if (failedInterval) {
            clearInterval(failedInterval);
            pollingIntervalsRef.current.delete(taskId);
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
      pollingIntervalsRef.current.forEach((interval) => {
        clearInterval(interval);
      });
      pollingIntervalsRef.current.clear();
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
      // 获取选中的模型信息
      const selectedModelInfo = MODELS.find(m => m.id === selectedModel) || MODELS[0];

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
          resolution: '2K',
          outputFormat: 'png',
          model: selectedModelInfo.kieModel
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
        // 设置当前活动任务 ID
        activeTaskIdRef.current = data.taskId;
        // 保持 isGenerating 为 true

        setMessages(prev => [...prev, {
          role: Role.MODEL,
          text: "已收到您的需求，正在创建生成任务..."
        }]);

        // 不再清除之前的轮询，让多个任务并行处理
        // 为新任务创建轮询
        const newInterval = setInterval(() => {
          pollTaskStatus(data.taskId);
        }, 3000);
        pollingIntervalsRef.current.set(data.taskId, newInterval);

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
      setMessages(prev => [...prev, { role: Role.USER, text: `正在上传: ${file.name}...` }]);

      // 步骤1: 获取预签名上传URL
      const presignResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'image/png'
        })
      });

      if (!presignResponse.ok) {
        throw new Error('获取上传地址失败');
      }

      const { uploadUrl, url: finalUrl } = await presignResponse.json();
      console.log("Uploading to:", uploadUrl);

      // 步骤2: 直接上传到COS
      let uploadResponse;
      try {
        uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'image/png',
          },
          body: file
        });
        console.log("Upload response status:", uploadResponse.status);
      } catch (fetchError: any) {
        console.error("Upload fetch error:", fetchError);
        throw new Error(`上传失败: ${fetchError.message || '网络错误'}`);
      }

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Upload failed:", uploadResponse.status, errorText);
        throw new Error(`上传失败: ${uploadResponse.status}`);
      }

      const newImg: ImageAsset = {
        id: Date.now().toString(),
        url: finalUrl,
        alt: `上传图: ${file.name}`,
        timestamp: Date.now()
      };
      setGalleryImages(prev => [newImg, ...prev]);
      // 上传图片后，同时更新 beforeUrl 和 afterUrl
      setDesignState(prev => ({ ...prev, beforeUrl: finalUrl, afterUrl: finalUrl }));
      setUploadedImageUrl(finalUrl);
      setMessages(prev => [...prev, { role: Role.USER, text: `已上传文件: ${file.name}` }]);
      setIsCurrentAdded(true);
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMsg = error?.message || String(error) || '请稍后重试';
      setMessages(prev => [...prev, {
        role: Role.MODEL,
        text: `上传失败：${errorMsg}`
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
          onImageSelect={(img) => {
            // 选择图片作为原图
            setUploadedImageUrl(img.url);
            setDesignState(prev => ({ ...prev, beforeUrl: img.url, afterUrl: img.url }));
            setIsCurrentAdded(false);
            setMessages(prev => [...prev, { role: Role.USER, text: `已选择图片: ${img.alt}` }]);
          }}
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
