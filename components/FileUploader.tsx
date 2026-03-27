'use client';

import { useState, useCallback } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { cn } from '@/lib/utils';
import { Spinner } from './ui';

export function FileUploader() {
  const { loadFile, isLoading, error, fileName } = useDataStore();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      return;
    }
    await loadFile(file);
  }, [loadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  if (fileName) {
    return (
      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
        <div className="flex items-center gap-2 text-green-300 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="truncate">{fileName}</span>
        </div>
        <button
          onClick={() => useDataStore.getState().reset()}
          className="mt-2 text-xs text-foreground-subtle hover:text-foreground-muted"
        >
          다른 파일 선택
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'relative p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer',
        isDragging
          ? 'border-primary-500 bg-primary-500/10'
          : 'border-primary-500/30 bg-primary-500/5 hover:border-primary-500/50 hover:bg-primary-500/10'
      )}
    >
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />
      
      {isLoading ? (
        <div className="flex flex-col items-center gap-2 py-2">
          <Spinner />
          <span className="text-xs text-foreground-muted">로딩 중...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-2">
          <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div className="text-center">
            <p className="text-sm text-foreground-muted">ERP 매출실적 파일</p>
            <p className="text-xs text-foreground-subtle">.xlsx, .xls</p>
          </div>
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
