"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, X, ImageIcon, CheckCircle, Loader2, FileArchive, Shield } from "lucide-react";
import JSZip from "jszip";
import { reportConversionScale } from "@/lib/stats";

interface ImageFile {
  file: File;
  preview: string;
  id: string;
  status: "pending" | "processing" | "completed" | "error";
  resultUrl?: string;
  width?: number;
  height?: number;
  resultSize?: number;
}

interface ImageConverterProps {
  files: File[];
  onReset: () => void;
  lang: string;
  dict: any;
  mode?: "converter" | "compressor";
}

export const ImageConverter: React.FC<ImageConverterProps> = ({ files, onReset, lang, dict, mode = "converter" }) => {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>(mode === "compressor" ? "webp" : "webp");
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [quality, setQuality] = useState<number>(0.8);
  const [preserveExif, setPreserveExif] = useState<boolean>(false);
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

    // Metadata extraction (Dimensions)
    newFiles.forEach(f => {
      const img = new Image();
      img.src = URL.createObjectURL(f.file);
      img.onload = () => {
        setImageFiles(prev => prev.map(p => p.id === f.id ? { ...p, width: img.width, height: img.height } : p));
        URL.revokeObjectURL(img.src);
      };
    });

    const generateHeicPreviews = async () => {
      const heicFiles = newFiles.filter(f => 
        f.file.name.toLowerCase().endsWith(".heic") || f.file.name.toLowerCase().endsWith(".heif")
      );
      
      if (heicFiles.length > 0) {
        try {
          const heic2any = (await import("heic2any")).default;
          for (const hFile of heicFiles) {
            const blob = await heic2any({
              blob: hFile.file,
              toType: "image/jpeg",
              quality: 0.1,
            });
            const url = URL.createObjectURL(Array.isArray(blob) ? blob[0] : blob);
            setImageFiles(prev => prev.map(p => p.id === hFile.id ? { ...p, preview: url } : p));
          }
        } catch (e) {
          console.error("Failed to generate HEIC preview", e);
        }
      }
    };
    
    generateHeicPreviews();

    return () => {
      newFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  const estimateSize = (imgFile: ImageFile) => {
    if (!imgFile.width || !imgFile.height) return null;
    
    const w = targetWidth > 0 ? targetWidth : imgFile.width;
    const h = targetWidth > 0 ? (imgFile.height * (targetWidth / imgFile.width)) : imgFile.height;
    const pixels = w * h;
    
    let ratio = quality * 0.2; // Adjusted estimate based on quality
    if (targetFormat === "png") ratio = 0.5;
    else if (targetFormat === "jpeg") ratio = quality * 0.25;
    
    const sizeBytes = pixels * ratio;
    const sizeKb = (sizeBytes / 1024).toFixed(1);
    return dict.image.est_size.replace("{size}", sizeKb);
  };

  const convertImage = async (imgFile: ImageFile): Promise<{ url: string, size: number }> => {
    let sourceBlob: Blob = imgFile.file;
    const isHeic = imgFile.file.name.toLowerCase().endsWith(".heic") || imgFile.file.name.toLowerCase().endsWith(".heif");

    if (isHeic) {
      const heic2any = (await import("heic2any")).default;
      const converted = await heic2any({
        blob: imgFile.file,
        toType: "image/jpeg",
        quality: 0.9
      });
      sourceBlob = Array.isArray(converted) ? converted[0] : converted;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (typeof document === "undefined") return reject(new Error("Browser environment required"));
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Failed to get canvas context"));

        const scale = targetWidth > 0 ? targetWidth / img.width : 1;
        canvas.width = targetWidth > 0 ? targetWidth : img.width;
        canvas.height = targetWidth > 0 ? img.height * scale : img.height;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const mimeType = `image/${targetFormat}`;
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("Blob conversion failed"));
          resolve({
            url: URL.createObjectURL(blob),
            size: blob.size
          });
        }, mimeType, quality);
      };
      img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      img.src = URL.createObjectURL(sourceBlob);
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
            const { url, size } = await convertImage(updatedFiles[i]);
            updatedFiles[i] = { ...updatedFiles[i], status: "completed", resultUrl: url, resultSize: size };
        } catch (error) {
            console.error(error);
            updatedFiles[i] = { ...updatedFiles[i], status: "error" };
        }
        setImageFiles([...updatedFiles]);
    }

    // 統計を報告
    const newlyCompleted = updatedFiles.filter(f => f.status === "completed" && f.resultSize);
    if (newlyCompleted.length > 0) {
      const totalBytes = newlyCompleted.reduce((acc, curr) => acc + (curr.resultSize || 0), 0);
      reportConversionScale(newlyCompleted.length, totalBytes);
    }

    setIsProcessingAll(false);
  };

  const handleDownloadAll = async () => {
    const completedFiles = imageFiles.filter(f => f.status === "completed" && f.resultUrl);
    if (completedFiles.length === 0) return;

    if (completedFiles.length === 1) {
      handleDownload(completedFiles[0]);
      return;
    }

    setIsZipping(true);
    const zip = new JSZip();
    
    for (const f of completedFiles) {
        const response = await fetch(f.resultUrl!);
        const blob = await response.blob();
        const fileName = f.file.name.substring(0, f.file.name.lastIndexOf("."));
        zip.file(`${fileName}.${targetFormat === "jpeg" ? "jpg" : targetFormat}`, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    if (typeof document !== "undefined") {
      const a = document.createElement("a");
      a.href = url;
      a.download = `converted_images_${new Date().getTime()}.zip`;
      a.click();
    }
    URL.revokeObjectURL(url);
    setIsZipping(false);
  };

  const handleDownload = (imgFile: ImageFile) => {
    if (!imgFile.resultUrl || typeof document === "undefined") return;
    const a = document.createElement("a");
    const originalName = imgFile.file.name.substring(0, imgFile.file.name.lastIndexOf("."));
    a.href = imgFile.resultUrl;
    a.download = `${originalName}.${targetFormat === "jpeg" ? "jpg" : targetFormat}`;
    a.click();
  };

  const allCompleted = imageFiles.length > 0 && imageFiles.every(f => f.status === "completed");
  const anyCompleted = imageFiles.some(f => f.status === "completed");
  const completedCount = imageFiles.filter(f => f.status === "completed").length;

  return (
    <div className="flex flex-col gap-6 h-full bg-transparent">
      {/* Options Bar */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2.5rem] md:rounded-[2.5rem] flex flex-col gap-8 shadow-sm ring-1 ring-slate-100 font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col gap-2 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{dict.image.format_label}</label>
            <select 
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-image/20 transition-all font-sans"
            >
              <option value="webp">WebP ({dict.image.optimized || "Optimized"})</option>
              <option value="png">PNG</option>
              <option value="jpeg">JPG</option>
            </select>
          </div>

          {mode === "compressor" && (
            <div className="flex flex-col gap-2 flex-1 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none flex justify-between">
                {dict.image.quality_label || "Quality"}
                <span className="text-accent-image">{Math.round(quality * 100)}%</span>
              </label>
              <div className="pt-2">
                <input 
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-accent-image"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{dict.image.resize_label}</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                placeholder={dict.image.placeholder}
                onChange={(e) => setTargetWidth(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm w-full font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-image/20"
              />
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tight shrink-0">px</span>
            </div>
          </div>

          {/* Exif Option */}
          <div className="flex flex-col gap-2 items-start text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{dict.image.privacy_label}</label>
            <button 
              onClick={() => setPreserveExif(!preserveExif)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold transition-all w-full h-[46px] ${
                !preserveExif 
                ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                : "bg-amber-50 border-amber-200 text-amber-700"
              }`}
            >
              <Shield className={`w-3.5 h-3.5 ${!preserveExif ? "fill-emerald-700/10" : ""}`} />
              {!preserveExif ? dict.image.exif_strip : dict.image.exif_keep}
            </button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-400 mr-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">{dict.common.local_process}</span>
          </div>

          <button 
            onClick={onReset}
            className="text-slate-400 hover:text-slate-600 text-xs sm:text-sm font-bold px-6 py-2 transition-colors uppercase tracking-tight"
          >
            {dict.common.cancel}
          </button>
          
          {anyCompleted && (
            <button 
              onClick={handleDownloadAll}
              disabled={isZipping}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm flex-1 sm:flex-none min-w-[160px]"
            >
              {isZipping ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : (
                completedCount === 1 ? <Download className="w-4 h-4 sm:w-5 sm:h-5" /> : <FileArchive className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              {completedCount === 1 ? dict.common.download : dict.image.download_all}
            </button>
          )}

          {!allCompleted && (
            <button 
              onClick={handleProcessAll}
              disabled={isProcessingAll || imageFiles.length === 0}
              className="bg-accent-image hover:bg-emerald-700 text-white font-black px-8 py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-xs sm:text-sm flex-1 sm:flex-none min-w-[200px]"
            >
              {isProcessingAll ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
              {mode === "compressor" ? (dict.image.process_compress || "Start Compression") : dict.image.process_all}
            </button>
          )}
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto pr-3 flex flex-col gap-4 scrollbar-thin">
        {imageFiles.map((imgFile) => (
          <div 
            key={imgFile.id}
            className="bg-white border border-slate-100 p-4 md:p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 md:gap-5 group hover:shadow-md hover:border-slate-200 transition-all shadow-sm"
          >
            {/* Thumbnail */}
            <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shrink-0 shadow-inner flex items-center justify-center">
              {imgFile.preview ? (
                <img src={imgFile.preview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-slate-200" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left w-full">
              <h4 className="font-black text-slate-800 truncate text-xs md:text-sm">{imgFile.file.name}</h4>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 md:gap-3 mt-1.5 text-[9px] md:text-[10px] text-slate-400 font-bold tracking-tight">
                <span className="px-1.5 py-0.5 bg-slate-100 rounded">{(imgFile.file.size / 1024).toFixed(1)} KB</span>
                
                {imgFile.status === "pending" && imgFile.width && (
                  <span className="flex items-center gap-2">
                    <span className="text-slate-300">→</span>
                    <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 animate-pulse font-black">
                      {estimateSize(imgFile)}
                    </span>
                  </span>
                )}

                {imgFile.status === "completed" && imgFile.resultSize && (
                  <span className="flex items-center gap-2">
                    <span className="text-slate-300">→</span>
                    <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-black flex items-center gap-1.5 animate-in slide-in-from-left-1 duration-500">
                      {(imgFile.resultSize / 1024).toFixed(1)} KB
                      {imgFile.file.size > imgFile.resultSize && (
                        <span className="text-[8px] bg-emerald-500 text-white px-1 rounded-sm scale-90 origin-right animate-pulse">
                          -{Math.round((1 - imgFile.resultSize / imgFile.file.size) * 100)}%
                        </span>
                      )}
                    </span>
                  </span>
                )}

                <span className="uppercase text-slate-300">
                  {imgFile.file.type.split("/")[1] || imgFile.file.name.split(".").pop()}
                  {imgFile.width && ` (${imgFile.width}x${imgFile.height})`}
                </span>
                
                {imgFile.file.name.toLowerCase().endsWith(".heic") && (
                  <span className="px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded">{dict.image.heic_support}</span>
                )}
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto justify-center sm:justify-end border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0 mt-2 sm:mt-0">
              {imgFile.status === "completed" && (
                <div className="flex items-center gap-1.5 text-accent-image bg-emerald-50 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-emerald-100">
                  <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{dict.image.success}</span>
                </div>
              )}
              {imgFile.status === "processing" && (
                <div className="flex items-center gap-2 text-accent-video">
                  <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                </div>
              )}
              
              {imgFile.status === "completed" ? (
                <button 
                  onClick={() => handleDownload(imgFile)}
                  className="bg-slate-900 hover:bg-slate-800 text-white p-2.5 md:p-3 rounded-lg md:rounded-xl border border-slate-800 transition-all shadow-md active:scale-95 group/dl"
                  title="Download"
                >
                  <Download className="w-4 h-4 md:w-5 md:h-5 group-hover/dl:scale-110 transition-transform" />
                </button>
              ) : (
                <div className="p-2.5 md:p-3 opacity-10">
                   <Download className="w-4 h-4 md:w-5 md:h-5" />
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
