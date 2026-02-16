"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MaterialIcon, Icons } from './material-icon';

type RecognitionStatus = 'idle' | 'listening' | 'stopped' | 'error';

interface VoiceInputProps {
  onTranscript?: (text: string) => void;
  onError?: (message: string) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript = () => {}, onError }) => {
  const [status, setStatus] = useState<RecognitionStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus('error');
      onError?.('您的浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器。');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';

    recognition.onstart = () => {
      setStatus('listening');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript(prev => prev + final);
        onTranscript(final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setStatus('error');

      if (event.error === 'not-allowed') {
        onError?.('请允许麦克风权限以使用语音输入功能。');
      } else if (event.error === 'no-speech') {
        // No speech detected, try again
        setStatus('idle');
      } else {
        onError?.('语音识别出错，请重试。');
      }
    };

    recognition.onend = () => {
      if (status === 'listening') {
        setStatus('stopped');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, onError, status]);

  const startListening = () => {
    if (recognitionRef.current && status !== 'listening') {
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && status === 'listening') {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (status === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  // Button state based on status
  const isListening = status === 'listening';
  const hasError = status === 'error';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col items-center gap-6">
        {/* Status indicator */}
        <div className="flex items-center gap-2 text-sm">
          {isListening && (
            <span className="flex items-center gap-2 text-primary">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              正在聆听...
            </span>
          )}
          {status === 'idle' && <span className="text-slate-500">点击按钮开始语音输入</span>}
          {status === 'stopped' && <span className="text-green-600">语音输入已停止</span>}
          {hasError && <span className="text-red-500">语音功能不可用</span>}
        </div>

        {/* Main microphone button */}
        <button
          onClick={toggleListening}
          disabled={hasError}
          className={`
            relative size-20 rounded-full flex items-center justify-center
            transition-all duration-300 ease-out
            ${isListening
              ? 'bg-primary shadow-lg shadow-primary/30 scale-110'
              : 'bg-slate-100 hover:bg-slate-200'
            }
            ${hasError ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-label={isListening ? '停止语音输入' : '开始语音输入'}
        >
          {/* Pulsing animation when listening */}
          {isListening && (
            <span className="absolute inset-0 rounded-full animate-ping bg-primary/30"></span>
          )}

          {/* Microphone icon */}
          <Icons.Mic
            className={`
              text-3xl transition-all duration-300
              ${isListening ? 'text-white scale-110' : 'text-slate-600'}
            `}
          />
        </button>

        {/* Transcript display */}
        {(transcript || interimTranscript) && (
          <div className="w-full max-w-md p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-700 leading-relaxed">
              {transcript}
              <span className="text-slate-400 italic">{interimTranscript}</span>
            </p>
          </div>
        )}

        {/* Clear button */}
        {transcript && (
          <button
            onClick={() => {
              setTranscript('');
              setInterimTranscript('');
            }}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            清除内容
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceInput;
