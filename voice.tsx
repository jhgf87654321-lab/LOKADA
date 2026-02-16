// components/VoiceInput.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

// 定义语音识别相关类型
type RecognitionStatus = 'idle' | 'listening' | 'stopped' | 'error';

// SpeechRecognition 接口声明
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInterface;
}

interface SpeechRecognitionInterface extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

// 扩展 Window 接口
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const VoiceInput = () => {
  // 状态管理
  const [transcript, setTranscript] = useState<string>(''); // 最终转写文本
  const [interimText, setInterimText] = useState<string>(''); // 实时中间文本
  const [status, setStatus] = useState<RecognitionStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // 语音识别实例引用
  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);

  // 初始化语音识别实例
  useEffect(() => {
    // 检查浏览器兼容性
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setErrorMsg('你的浏览器不支持语音识别功能，请使用Chrome/Edge/Safari 14.1+');
      setStatus('error');
      return;
    }

    // 创建识别实例
    const recognition = new SpeechRecognitionAPI() as SpeechRecognitionInterface;
    recognitionRef.current = recognition;

    // 配置参数
    recognition.lang = 'zh-CN'; // 中文识别
    recognition.interimResults = true; // 开启实时中间结果
    recognition.continuous = true; // 持续识别（不说话也不自动停止）
    recognition.maxAlternatives = 1; // 只取最匹配的结果

    // 实时结果回调
    recognition.onresult = (e) => {
      const interimTranscripts: string[] = [];
      const finalTranscripts: string[] = [];

      // 区分最终结果和中间结果
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalTranscripts.push(text);
        } else {
          interimTranscripts.push(text);
        }
      }

      // 更新状态
      setTranscript(finalTranscripts.join(''));
      setInterimText(interimTranscripts.join(''));
      setErrorMsg('');
    };

    // 错误处理
    recognition.onerror = (e) => {
      const errorMessages: Record<string, string> = {
        'not-allowed': '麦克风权限被拒绝，请允许麦克风访问后重试',
        'no-speech': '未检测到语音，请重新尝试',
        'audio-capture': '无法访问麦克风，请检查设备是否正常',
        'network': '网络错误，无法完成语音识别',
      };
      setErrorMsg(errorMessages[e.error] || `识别出错：${e.error}`);
      setStatus('error');
    };

    // 识别结束回调
    recognition.onend = () => {
      if (status === 'listening') {
        // 如果是正常监听状态下结束，自动重新启动（避免短语音自动停止）
        recognition.start();
      } else {
        setStatus('stopped');
      }
    };

    // 清理函数
    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [status]);

  // 启动录音
  const startListening = () => {
    if (!recognitionRef.current) return;
    
    setStatus('listening');
    setErrorMsg('');
    setInterimText('');
    // 重置之前的结果（也可以保留，根据需求调整）
    // setTranscript('');
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      setErrorMsg('启动录音失败：' + (err as Error).message);
      setStatus('error');
    }
  };

  // 停止录音
  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    setStatus('stopped');
    recognitionRef.current.stop();
  };

  // 清空文本
  const clearText = () => {
    setTranscript('');
    setInterimText('');
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 border rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">语音输入</h3>
      
      {/* 错误提示 */}
      {errorMsg && (
        <div className="mb-3 p-2 bg-red-50 text-red-600 rounded text-sm">
          {errorMsg}
        </div>
      )}

      {/* 状态提示 */}
      <div className="mb-3 text-sm text-gray-500">
        状态：
        {status === 'listening' && <span className="text-green-600">正在聆听...</span>}
        {status === 'idle' && <span>未开始</span>}
        {status === 'stopped' && <span>已停止</span>}
        {status === 'error' && <span className="text-red-600">出错</span>}
      </div>

      {/* 文本显示区域 */}
      <div 
        className="mb-4 p-3 border rounded min-h-[100px] bg-gray-50"
        aria-label="语音转写结果"
      >
        <p className="text-gray-800">{transcript}</p>
        {interimText && <p className="text-gray-400 italic">{interimText}</p>}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={startListening}
          disabled={status === 'listening' || status === 'error'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          开始录音
        </button>
        <button
          onClick={stopListening}
          disabled={status !== 'listening'}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400"
        >
          停止录音
        </button>
        <button
          onClick={clearText}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          清空
        </button>
      </div>
    </div>
  );
};

export default VoiceInput;