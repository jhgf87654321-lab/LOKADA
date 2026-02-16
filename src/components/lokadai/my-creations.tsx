"use client";

import React, { useState, useEffect } from 'react';
import { Icons } from './material-icon';

interface GenerationTask {
  id: string;
  status: string;
  prompt: string | null;
  originalImageUrl: string | null;
  generatedImageUrl: string | null;
  pointsDeducted: number;
  failMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface MyCreationsProps {
  onBack: () => void;
}

const MyCreations: React.FC<MyCreationsProps> = ({ onBack }) => {
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/generate');
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setTasks(data.tasks || []);
      }
    } catch (err) {
      setError('Failed to load generations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            已完成
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center gap-1">
            <span className="size-2 bg-blue-500 rounded-full animate-pulse"></span>
            生成中
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            失败
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
            等待中
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      <header className="h-20 border-b border-slate-100 px-8 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="size-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <Icons.ArrowBack />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">我的创作</h1>
            <p className="text-xs text-slate-500">查看您所有的 AI 生成作品</p>
          </div>
        </div>
        <button
          onClick={fetchTasks}
          className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-md shadow-primary/10"
        >
          <Icons.Download className="text-[18px]" />
          刷新
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <p className="text-sm text-slate-500">加载中...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={fetchTasks}
                  className="px-4 py-2 bg-primary text-white rounded-lg"
                >
                  重试
                </button>
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="size-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Icons.Image className="text-3xl text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-700 mb-2">暂无创作</h3>
              <p className="text-sm text-slate-500">开始您的第一个 AI 创作吧！</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div
                    className="aspect-[3/4] relative overflow-hidden bg-slate-200 cursor-zoom-in"
                  >
                    {task.status === 'completed' && task.generatedImageUrl ? (
                      <img
                        src={task.generatedImageUrl}
                        alt={task.prompt || 'AI 生成图片'}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : task.status === 'processing' ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <div className="flex flex-col items-center gap-2">
                          <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                          <span className="text-xs text-slate-500">生成中...</span>
                        </div>
                      </div>
                    ) : task.status === 'failed' ? (
                      <div className="w-full h-full flex items-center justify-center bg-red-50">
                        <div className="text-center p-4">
                          <Icons.Close className="text-3xl text-red-400 mx-auto mb-2" />
                          <p className="text-xs text-red-500">{task.failMessage || '生成失败'}</p>
                        </div>
                      </div>
                    ) : task.originalImageUrl ? (
                      <img
                        src={task.originalImageUrl}
                        alt={task.prompt || '原始图片'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <Icons.Image className="text-3xl text-slate-300" />
                      </div>
                    )}

                    {/* Overlay for completed images */}
                    {task.status === 'completed' && task.generatedImageUrl && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button className="size-9 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg">
                          <Icons.Visibility className="text-[20px]" />
                        </button>
                        <button className="size-9 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg">
                          <Icons.Download className="text-[20px]" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      {getStatusBadge(task.status)}
                      <span className="text-[10px] text-slate-400">
                        -{task.pointsDeducted} 积分
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 truncate">
                      {task.prompt || '无描述'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Icons.CalendarToday className="text-[12px]" />
                      {new Date(task.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyCreations;
