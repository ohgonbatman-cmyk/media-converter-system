"use client";

import React, { useState, useRef } from "react";
import { Upload } from "lucide-react";

interface FileUploaderProps {
  onFileSelect: (files: File[]) => void;
  accept: string;
  color: string;
  label: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, accept, color, label }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileSelect(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(Array.from(e.target.files));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative flex-1 min-h-[220px] sm:min-h-[300px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-6 sm:p-12 transition-all cursor-pointer group ${
        isDragging 
          ? "border-slate-400 bg-slate-50 scale-[0.98] shadow-inner" 
          : "border-slate-200 bg-white hover:bg-slate-50/50 hover:border-slate-300 shadow-sm"
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept={accept}
        multiple
        className="hidden"
      />

      <div className={`w-16 h-16 ${color.replace('bg-', 'bg-')} bg-opacity-90 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-xl transition-all shadow-md`}>
        <Upload className="text-white w-8 h-8" />
      </div>
      
      <h3 className="text-xl font-black mb-2 text-slate-900">{label}</h3>
      <p className="text-slate-400 text-center max-w-sm text-sm">
        ファイルをドラッグ＆ドロップ、またはクリックして選択
      </p>
      
      <div className="mt-8 flex gap-2">
        {accept.split(",").map((ext) => (
          <span key={ext} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-mono text-slate-400 uppercase font-bold tracking-tight shadow-sm">
            {ext.trim().replace('.', '')}
          </span>
        ))}
      </div>
    </div>
  );
};
