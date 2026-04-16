"use client";

import React, { useState, useEffect } from "react";
import { Download, X, CheckCircle, Loader2, Play, FileDigit, Settings2, Zap, Gauge } from "lucide-react";
import { reportConversionScale } from "@/lib/stats";
import { trackEvent } from "@/lib/tracking";
import { compressPdf } from "@/lib/pdf-compress";

interface MediaFile {
  file: File;
  id: string;
  status: "pending" | "processing" | "completed" | "error";
  resultBlob?: Blob;
  progress: number;
  resultSize?: number;
}

interface PdfCompressorProps {
  files: File[];
  onReset: () => void;
  dict: any;
}

export const PdfCompressor: React.FC<PdfCompressorProps> = ({ files, onReset, dict }) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quality, setQuality] = useState(0.75); // Default Recommended

  useEffect(() => {
    const newFiles = files.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: "pending" as const,
      progress: 0,
    }));
    setMediaFiles(newFiles);
  }, [files]);

  const handleCompress = async (mFile: MediaFile) => {
    setIsProcessing(true);
    setMediaFiles(prev => prev.map(f => f.id === mFile.id ? { ...f, status: "processing", progress: 0 } : f));

    try {
      const arrayBuffer = await mFile.file.arrayBuffer();
      const resultUint8 = await compressPdf(arrayBuffer, quality, (p) => {
        setMediaFiles(prev => prev.map(f => f.id === mFile.id ? { ...f, progress: p } : f));
      });

      // Fix TS error: cast to any to satisfy BlobPart requirement in some environments
      const blob = new Blob([resultUint8 as any], { type: "application/pdf" });
      const size = blob.size;

      setMediaFiles(prev => prev.map(f => f.id === mFile.id ? { 
        ...f, 
        status: "completed", 
        resultBlob: blob, 
        progress: 100, 
        resultSize: size 
      } : f));
      
      reportConversionScale(1, size);
    } catch (error) {
      console.error(error);
      setMediaFiles(prev => prev.map(f => f.id === mFile.id ? { ...f, status: "error" } : f));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessAll = async () => {
    const pendingFiles = mediaFiles.filter(f => f.status === "pending");
    if (pendingFiles.length === 0) return;

    trackEvent("start_operation", { media_type: "compress_pdf", quality: quality.toString(), count: pendingFiles.length });

    for (const mFile of pendingFiles) {
      await handleCompress(mFile);
    }
  };

  const handleDownload = (mFile: MediaFile) => {
    if (!mFile.resultBlob) return;
    const url = URL.createObjectURL(mFile.resultBlob);
    const a = document.createElement("a");
    const originalName = mFile.file.name.substring(0, mFile.file.name.lastIndexOf("."));
    a.href = url;
    a.download = `${originalName}_compressed.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allCompleted = mediaFiles.length > 0 && mediaFiles.every(f => f.status === "completed");

  return (
    <div className="flex flex-col gap-6 h-full font-sans">
      {/* Options Bar */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2.5rem] flex flex-col gap-8 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
             <Settings2 className="w-5 h-5 text-red-500" />
             <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">{dict.pdf.quality_label}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { val: 0.4, label: dict.pdf.quality_strong, icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
              { val: 0.75, label: dict.pdf.quality_recommended, icon: CheckCircle, color: "text-red-500", bg: "bg-red-50" },
              { val: 0.9, label: dict.pdf.quality_low, icon: Gauge, color: "text-slate-500", bg: "bg-slate-50" }
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => setQuality(opt.val)}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                  quality === opt.val 
                  ? "border-red-500 bg-red-50/50 shadow-inner" 
                  : "border-slate-100 hover:border-slate-200 bg-white"
                }`}
              >
                <div className={`p-2 rounded-lg ${opt.bg} ${opt.color}`}>
                  <opt.icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-black uppercase tracking-tight ${quality === opt.val ? "text-red-600" : "text-slate-500"}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-400 mr-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">{dict.common.local_process}</span>
          </div>

          <button 
            onClick={onReset} 
            className="text-slate-400 hover:text-slate-600 text-xs font-bold px-6 py-2 transition-colors uppercase tracking-tight"
          >
            {dict.common.cancel}
          </button>
          
          {!allCompleted && (
            <button 
                onClick={handleProcessAll}
                disabled={isProcessing || mediaFiles.length === 0}
                className="bg-red-500 hover:bg-red-600 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-xs sm:text-sm flex-1 sm:flex-none min-w-[220px]"
            >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                {dict.pdf.compress_process}
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-3 scrollbar-thin">
        {mediaFiles.map((mFile) => {
          const savings = mFile.resultSize && mFile.file.size > mFile.resultSize
            ? Math.round((1 - mFile.resultSize / mFile.file.size) * 100)
            : 0;

          return (
            <div 
              key={mFile.id}
              className="bg-white border border-slate-100 p-4 md:p-5 rounded-[2rem] flex flex-col sm:flex-row items-center gap-4 group hover:shadow-md transition-all shadow-sm"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shrink-0 shadow-inner">
                <FileDigit className="w-6 h-6 text-red-400" />
              </div>

              <div className="flex-1 min-w-0 text-center sm:text-left w-full">
                <h4 className="font-black text-slate-800 truncate text-xs">{mFile.file.name}</h4>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1.5 text-[10px] text-slate-400 font-bold font-mono uppercase">
                  <span>{dict.pdf.original_size}: {(mFile.file.size / 1024 / 1024).toFixed(2)} MB</span>
                  {mFile.resultSize && (
                    <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded">
                      {dict.pdf.compressed_size}: {(mFile.resultSize / 1024 / 1024).toFixed(2)} MB (-{savings}%)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {mFile.status === "completed" && (
                  <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm animate-in zoom-in-95">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">READY</span>
                  </div>
                )}
                
                {mFile.status === "processing" && (
                  <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full transition-all" style={{ width: `${mFile.progress}%` }} />
                  </div>
                )}

                {mFile.status === "completed" ? (
                  <button 
                    onClick={() => {
                      trackEvent("download_result", { media_type: "compress_pdf" });
                      handleDownload(mFile);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl shadow-md transition-all group/dl active:scale-95"
                  >
                    <Download className="w-5 h-5 group-hover/dl:scale-110 transition-transform" />
                  </button>
                ) : (
                  <button 
                    onClick={() => handleCompress(mFile)}
                    disabled={isProcessing}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl border border-slate-200 transition-all disabled:opacity-30 active:scale-95"
                  >
                    <Play className="w-5 h-5 fill-current" />
                  </button>
                )}
                
                <button 
                  onClick={() => setMediaFiles(prev => prev.filter(f => f.id !== mFile.id))}
                  className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
