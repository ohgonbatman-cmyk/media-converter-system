"use client";

import React, { useState, useEffect } from "react";
import { Download, X, ImageIcon, CheckCircle, Loader2, FileArchive } from "lucide-react";
import JSZip from "jszip";

interface ImageFile {
  file: File;
  preview: string;
  id: string;
  status: "pending" | "processing" | "completed" | "error";
  resultUrl?: string;
  width?: number;
  height?: number;
}

interface ImageConverterProps {
  files: File[];
  onReset: () => void;
}

export const ImageConverter: React.FC<ImageConverterProps> = ({ files, onReset }) => {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>("webp");
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  useEffect(() => {
    const newFiles = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7),
      status: "pending" as const,
    }));
    setImageFiles(newFiles);

    return () => {
      newFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  const convertImage = async (imgFile: ImageFile): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        const scale = targetWidth > 0 ? targetWidth / img.width : 1;
        canvas.width = targetWidth > 0 ? targetWidth : img.width;
        canvas.height = targetWidth > 0 ? img.height * scale : img.height;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const mimeType = `image/${targetFormat}`;
        const dataUrl = canvas.toDataURL(mimeType, 0.9);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = imgFile.preview;
    });
  };

  const handleProcessAll = async () => {
    setIsProcessingAll(true);
    const updatedFiles = [...imageFiles];

    for (let i = 0; i < updatedFiles.length; i++) {
        if (updatedFiles[i].status === "completed") continue;
        
        updatedFiles[i] = { ...updatedFiles[i], status: "processing" };
        setImageFiles([...updatedFiles]);
        
        try {
            const resultUrl = await convertImage(updatedFiles[i]);
            updatedFiles[i] = { ...updatedFiles[i], status: "completed", resultUrl };
        } catch (error) {
            console.error(error);
            updatedFiles[i] = { ...updatedFiles[i], status: "error" };
        }
        setImageFiles([...updatedFiles]);
    }
    setIsProcessingAll(false);
  };

  const handleDownloadAll = async () => {
    const completedFiles = imageFiles.filter(f => f.status === "completed" && f.resultUrl);
    if (completedFiles.length === 0) return;

    setIsZipping(true);
    const zip = new JSZip();
    
    for (const f of completedFiles) {
        const response = await fetch(f.resultUrl!);
        const blob = await response.blob();
        const fileName = f.file.name.substring(0, f.file.name.lastIndexOf("."));
        zip.file(`${fileName}.${targetFormat}`, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted_images_${new Date().getTime()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setIsZipping(false);
  };

  const handleDownload = (imgFile: ImageFile) => {
    if (!imgFile.resultUrl) return;
    const a = document.createElement("a");
    const originalName = imgFile.file.name.substring(0, imgFile.file.name.lastIndexOf("."));
    a.href = imgFile.resultUrl;
    a.download = `${originalName}.${targetFormat}`;
    a.click();
  };

  const allCompleted = imageFiles.length > 0 && imageFiles.every(f => f.status === "completed");
  const anyCompleted = imageFiles.some(f => f.status === "completed");

  return (
    <div className="flex flex-col gap-8 h-full bg-transparent">
      {/* Options Bar */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-wrap items-center gap-6 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">変換先形式</label>
          <select 
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-image/20 transition-all"
          >
            <option value="webp">WebP (推奨)</option>
            <option value="png">PNG</option>
            <option value="jpeg">JPG</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">リサイズ (幅)</label>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="元のサイズ"
              onChange={(e) => setTargetWidth(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm w-32 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-image/20"
            />
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">px</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <button 
            onClick={onReset}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold transition-colors px-4"
          >
            キャンセル
          </button>
          
          {anyCompleted && (
            <button 
              onClick={handleDownloadAll}
              disabled={isZipping}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-3.5 rounded-2xl transition-all shadow-lg flex items-center gap-2 text-sm"
            >
              {isZipping ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileArchive className="w-5 h-5" />}
              すべて保存 (ZIP)
            </button>
          )}

          {!allCompleted && (
            <button 
              onClick={handleProcessAll}
              disabled={isProcessingAll || imageFiles.length === 0}
              className="bg-accent-image hover:bg-emerald-700 text-white font-black px-10 py-3.5 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
            >
              {isProcessingAll ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
              一括変換を開始
            </button>
          )}
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto pr-3 flex flex-col gap-4 scrollbar-thin">
        {imageFiles.map((imgFile) => (
          <div 
            key={imgFile.id}
            className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-5 transition-all shadow-sm hover:shadow-md hover:border-slate-200"
          >
            {/* Thumbnail */}
            <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shrink-0 shadow-inner">
              <img src={imgFile.preview} alt="preview" className="w-full h-full object-cover" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-slate-800 truncate text-sm">{imgFile.file.name}</h4>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-bold tracking-tight">
                <span className="px-1.5 py-0.5 bg-slate-100 rounded">{(imgFile.file.size / 1024).toFixed(1)} KB</span>
                <span className="uppercase text-slate-300">{imgFile.file.type.split("/")[1]}</span>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-4">
              {imgFile.status === "completed" && (
                <div className="flex items-center gap-1.5 text-accent-image bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">SUCCESS</span>
                </div>
              )}
              {imgFile.status === "processing" && (
                <div className="flex items-center gap-2 text-accent-video">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}
              
              {imgFile.status === "completed" ? (
                <button 
                  onClick={() => handleDownload(imgFile)}
                  className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl border border-slate-800 transition-all shadow-md active:scale-95 group/dl"
                  title="Download"
                >
                  <Download className="w-5 h-5 group-hover/dl:scale-110 transition-transform" />
                </button>
              ) : (
                <div className="p-3 opacity-10">
                   <Download className="w-5 h-5" />
                </div>
              )}
              
              <button 
                onClick={() => setImageFiles(prev => prev.filter(f => f.id !== imgFile.id))}
                className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
