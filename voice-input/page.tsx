// app/voice-input/page.tsx
// 这是服务端组件（无需 'use client'），可以直接引入客户端组件
import VoiceInput from '@/components/lokadai/voice-input';

// 页面组件（默认导出）
export default function VoiceInputPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
      {/* 页面标题 */}
      <div className="max-w-3xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800">Next.js 语音输入功能</h1>
        <p className="mt-2 text-gray-600">点击按钮开始语音转文字</p>
      </div>
      
      {/* 引入语音输入组件 */}
      <div className="max-w-3xl mx-auto">
        <VoiceInput />
      </div>
    </main>
  );
}