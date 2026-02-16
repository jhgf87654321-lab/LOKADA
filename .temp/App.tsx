
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Role, Message, ImageAsset, DesignState, ModelOption, ViewState } from './types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import PreviewArea from './components/PreviewArea';
import GalleryBackend from './components/GalleryBackend';
import AuthPage from './components/AuthPage';
import { generateTextResponse } from './services/geminiService';

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

  const handleSendMessage = useCallback(async (text: string) => {
    const userMsg: Message = { role: Role.USER, text };
    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);
    setIsCurrentAdded(false);

    try {
      const responseText = await generateTextResponse(text, messages);
      const modelMsg: Message = { role: Role.MODEL, text: responseText };
      setMessages(prev => [...prev, modelMsg]);

      // Mock generation delay and logic
      if (text.match(/颜色|灰|反光|材质|修改/)) {
          setTimeout(() => {
            setDesignState(prev => ({
              ...prev,
              beforeUrl: prev.afterUrl,
              colorScheme: text.includes('藏蓝') ? '藏蓝色 (Pantone 19-4029)' : prev.colorScheme,
              material: text.includes('轻量') ? '超轻涤棉混纺 / 泼水处理' : prev.material
            }));
            setIsGenerating(false);
          }, 2500);
      } else {
        setIsGenerating(false);
      }
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
    }
  }, [messages]);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const newImg: ImageAsset = {
        id: Date.now().toString(),
        url: url,
        alt: `上传图: ${file.name}`,
        timestamp: Date.now()
      };
      setGalleryImages(prev => [newImg, ...prev]);
      setDesignState(prev => ({ ...prev, afterUrl: url }));
      setMessages(prev => [...prev, { role: Role.USER, text: `已上传文件: ${file.name}` }]);
      setIsCurrentAdded(true);
    };
    reader.readAsDataURL(file);
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
      <Header onStartTrial={() => setView('auth')} />
      
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

      {view === 'auth' && (
        <AuthPage 
          onBack={() => setView('main')} 
          onSuccess={() => setView('main')}
        />
      )}
    </div>
  );
};

export default App;
