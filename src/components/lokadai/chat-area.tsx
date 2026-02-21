"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Message, Role } from './types';
import { MaterialIcon, Icons } from './material-icon';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
  onFileUpload: (file: File) => void;
}

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'stopped' | 'error';

const ChatArea: React.FC<ChatAreaProps> = ({ messages, onSendMessage, isGenerating, onFileUpload }) => {
  const [input, setInput] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  const toggleVoiceInput = async () => {
    // 正在录音 -> 停止
    if (voiceStatus === 'listening') {
      mediaRecorderRef.current?.stop();
      setVoiceStatus('stopped');
      return;
    }

    // 开始录音
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('当前浏览器不支持录音，请使用最新版 Chrome 或 Edge。');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];

        if (!blob.size) return;

        // 显示处理中状态
        setVoiceStatus('processing');
        setInterimTranscript('正在识别...');

        try {
          // 直接上传 webm，由服务端转码并调用阿里云识别（避免浏览器端 @ffmpeg 与 Turbopack 冲突）
          const res = await fetch('/api/asr', {
            method: 'POST',
            body: blob,
            headers: {
              'Content-Type': 'audio/webm'
            }
          });
          const data = await res.json();

          if (data?.text) {
            setInput((prev) => prev + data.text);
          } else if (data?.error) {
            console.error('ASR error:', data.error, data?.details);
            const hint = data?.details ? `（详见控制台 details）` : '';
            setInterimTranscript(`识别失败: ${data.error}${hint}`);
          }
        } catch (e) {
          console.error('转码或识别失败:', e);
          setInterimTranscript(`处理失败: ${e instanceof Error ? e.message : '未知错误'}`);
        } finally {
          setVoiceStatus('idle');
          stream.getTracks().forEach((t) => t.stop());
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setVoiceStatus('listening');
      setInterimTranscript('');
    } catch (err) {
      console.error('获取麦克风失败:', err);
      setVoiceStatus('error');
    }
  };

  const handleSubmit = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <section className="flex-1 flex flex-col bg-white relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-start gap-4 ${msg.role === Role.USER ? 'flex-row-reverse' : ''}`}>
            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
              msg.role === Role.USER ? 'bg-slate-200' : 'bg-primary/20 text-primary'
            }`}>
              <MaterialIcon name={msg.role === Role.USER ? 'person' : 'smart_toy'} />
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === Role.USER
              ? 'bg-primary text-white rounded-tr-none'
              : 'bg-slate-100 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              {msg.suggestions && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => onSendMessage(s)}
                      className="px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-[12px] text-primary hover:bg-primary hover:text-white transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-start gap-4 animate-pulse">
            <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <Icons.SmartToy />
            </div>
            <div className="max-w-[80%] bg-slate-100 p-4 rounded-2xl rounded-tl-none border-l-4 border-primary shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex space-x-1">
                  <div className="size-1.5 bg-primary rounded-full animate-bounce"></div>
                  <div className="size-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="size-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <p className="text-sm font-medium">LOKADA AI 正在构思您的设计...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-200 bg-white">
        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-2xl border border-transparent focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-primary transition-colors flex items-center justify-center"
              title="上传图片"
            >
              <Icons.Image />
            </button>
            <button
              onClick={toggleVoiceInput}
              className={`p-2 transition-colors flex items-center justify-center relative ${
                voiceStatus === 'listening' ? 'text-primary' : 'text-slate-400 hover:text-primary'
              }`}
              title={voiceStatus === 'listening' ? '停止语音输入' : '语音输入'}
            >
              {voiceStatus === 'listening' && (
                <span className="absolute inset-0 rounded-full animate-ping bg-primary/30"></span>
              )}
              {voiceStatus === 'processing' ? <span className="animate-spin">⏳</span> : <Icons.Mic />}
            </button>
            <div className="flex-1 relative">
              <textarea
                value={input + interimTranscript}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                className="w-full bg-transparent border-none focus:ring-0 text-sm py-2 px-2 resize-none custom-scrollbar"
                placeholder={voiceStatus === 'listening' ? '正在聆听...' : voiceStatus === 'processing' ? '正在处理...' : "描述您的设计想法，或点击图片图标上传..."}
                rows={1}
              />
            </div>
            <button
              onClick={handleSubmit}
              className="size-10 bg-primary text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-all shadow-md shadow-primary/20 shrink-0"
            >
              <Icons.Send />
            </button>
          </div>
          <p className="mt-2 text-[11px] text-center text-slate-400 font-medium">支持上传 JPG, PNG, WEBP 设计原稿进行二次优化</p>
        </div>
      </div>
    </section>
  );
};

export default ChatArea;
