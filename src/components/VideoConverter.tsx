"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, X, Video, CheckCircle, Loader2, PlayCircle, FileArchive, Play, Smartphone, Music } from "lucide-react";
import { useFFmpeg } from "@/hooks/useFFmpeg";
import { fetchFile } from "@ffmpeg/util";
import JSZip from "jszip";

interface MediaFile {
  file: File;
  id: string;
  status: "pending" | "loading" | "processing" | "completed" | "error";
  resultUrl?: string;
  progress: number;
  duration?: number;
  resultSize?: number;
}

interface VideoConverterProps {
  files: File[];
  onReset: () => void;
}

type Preset = "none" | "iphone" | "youtube" | "tiktok" | "mp3_extract";

export const VideoConverter: React.FC<VideoConverterProps> = ({ files, onReset }) => {
  const { load, progress, resetProgress } = useFFmpeg();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>("mp4");
  const [preset, setPreset] = useState<Preset>("none");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [ffmpegInstance, setFfmpegInstance] = useState<any>(null);

  useEffect(() => {
    const newFiles = files.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: "pending" as const,
      progress: 0,
    }));
    setMediaFiles(newFiles);

    // Get durations
    newFiles.forEach(mFile => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = URL.createObjectURL(mFile.file);
      video.onloadedmetadata = () => {
        setMediaFiles(prev => prev.map(p => p.id === mFile.id ? { ...p, duration: video.duration } : p));
        URL.revokeObjectURL(video.src);
      };
    });
  }, [files]);

  const estimateSize = (mFile: MediaFile) => {
    if (!mFile.duration) return null;
    
    let totalBps = 0;
    switch (preset) {
      case "iphone":
        totalBps = 2500000; // ~2.5Mbps
        break;
      case "youtube":
        totalBps = 8500000; // ~8.5Mbps (High Quality)
        break;
      case "tiktok":
        totalBps = 4500000; // ~4.5Mbps
        break;
      case "mp3_extract":
        totalBps = 192000; // 192kbps
        break;
      default:
        totalBps = 2000000; // ~2Mbps standard
    }
    
    const sizeBytes = (totalBps * mFile.duration) / 8;
    return (sizeBytes / (1024 * 1024)).toFixed(1);
  };

  const convertVideo = async (mediaFile: MediaFile) => {
    const ffmpeg = ffmpegInstance || await load();
    if (!ffmpegInstance) setFfmpegInstance(ffmpeg);
    
    setIsProcessing(true);
    resetProgress();
    
    setMediaFiles(prev => prev.map(f => f.id === mediaFile.id ? { ...f, status: "processing" } : f));

    try {
      const inputName = "input_" + mediaFile.file.name.replace(/\s+/g, "_");
      const currentOutputFormat = preset === "mp3_extract" ? "mp3" : targetFormat;
      const outputName = `output_${mediaFile.id}.${currentOutputFormat}`;

      await ffmpeg.writeFile(inputName, await fetchFile(mediaFile.file));
      
      let args: string[] = ["-i", inputName];
      switch (preset) {
        case "iphone":
          args.push("-c:v", "libx264", "-crf", "23", "-preset", "fast", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart");
          break;
        case "youtube":
          args.push("-c:v", "libx264", "-crf", "18", "-preset", "fast", "-c:a", "aac", "-b:a", "384k");
          break;
        case "tiktok":
          args.push("-vf", "crop='if(gt(a,9/16),ih*9/16,iw)':'if(gt(a,9/16),ih,iw*16/9)':'(iw-ow)/2':'(ih-oh)/2',scale=1080:1920", "-c:v", "libx264", "-crf", "23", "-preset", "fast", "-c:a", "aac", "-b:a", "128k");
          break;
        case "mp3_extract":
          args.push("-vn", "-c:a", "libmp3lame", "-b:a", "192k");
          break;
        default:
          if (targetFormat === "mp4") {
            args.push("-c:v", "libx264", "-preset", "fast", "-c:a", "aac");
          } else if (targetFormat === "webm") {
            args.push("-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-c:a", "libopus");
          } else if (targetFormat === "mov") {
            args.push("-c:v", "libx264", "-preset", "fast", "-c:a", "aac");
          }
      }

      args.push(outputName);
      
      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputName);
      const size = (data as Uint8Array).length;
      const mimeType = preset === "mp3_extract" ? "audio/mpeg" : `video/${currentOutputFormat}`;
      const url = URL.createObjectURL(new Blob([(data as any).buffer], { type: mimeType }));

      setMediaFiles(prev => prev.map(f => f.id === mediaFile.id ? { ...f, status: "completed", resultUrl: url, progress: 100, resultSize: size } : f));
      
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (error) {
      console.error(error);
      setMediaFiles(prev => prev.map(f => f.id === mediaFile.id ? { ...f, status: "error" } : f));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessAll = async () => {
    const pendingFiles = mediaFiles.filter(f => f.status === "pending");
    if (pendingFiles.length === 0) return;

    for (const mFile of pendingFiles) {
        await convertVideo(mFile);
    }
  };

  const handleDownloadAll = async () => {
    const completedFiles = mediaFiles.filter(f => f.status === "completed" && f.resultUrl);
    if (completedFiles.length === 0) return;

    setIsZipping(true);
    const zip = new JSZip();
    
    for (const f of completedFiles) {
        const response = await fetch(f.resultUrl!);
        const blob = await response.blob();
        const fileName = f.file.name.substring(0, f.file.name.lastIndexOf("."));
        const ext = preset === "mp3_extract" ? "mp3" : targetFormat;
        zip.file(`${fileName}.${ext}`, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted_videos_${new Date().getTime()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setIsZipping(false);
  };

  const handleDownload = (mFile: MediaFile) => {
    if (!mFile.resultUrl) return;
    const a = document.createElement("a");
    const originalName = mFile.file.name.substring(0, mFile.file.name.lastIndexOf("."));
    const ext = preset === "mp3_extract" ? "mp3" : targetFormat;
    a.href = mFile.resultUrl;
    a.download = `${originalName}.${ext}`;
    a.click();
  };

  const anyCompleted = mediaFiles.some(f => f.status === "completed");
  const allCompleted = mediaFiles.length > 0 && mediaFiles.every(f => f.status === "completed");

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Options Bar */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-wrap items-center gap-6 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left leading-none">基本形式</label>
          <select 
            value={targetFormat}
            onChange={(e) => {
              setTargetFormat(e.target.value);
              if (preset === "mp3_extract") setPreset("none");
            }}
            disabled={isProcessing || preset === "mp3_extract"}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-video/20 transition-all disabled:opacity-50"
          >
            <option value="mp4">MP4 (H.264)</option>
            <option value="webm">WebM (VP9)</option>
            <option value="mov">MOV (QuickTime)</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left leading-none">最適化プリセット</label>
          <select 
            value={preset}
            onChange={(e) => setPreset(e.target.value as Preset)}
            disabled={isProcessing}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-video/20 transition-all"
          >
            <option value="none">なし (基本形式を使用)</option>
            <option value="iphone">iPhone / iPad 再生用</option>
            <option value="youtube">YouTube アップロード用 (高画質)</option>
            <option value="tiktok">TikTok / Shorts 用 (9:16 クロップ)</option>
            <option value="mp3_extract">音声のみ抽出 (MP3)</option>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <button onClick={onReset} className="text-slate-400 hover:text-slate-600 text-sm font-bold px-4 transition-colors">
            キャンセル
          </button>
          
          {anyCompleted && (
            <button 
              onClick={handleDownloadAll}
              disabled={isZipping || isProcessing}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-3.5 rounded-2xl transition-all shadow-lg flex items-center gap-2 text-sm"
            >
              {isZipping ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileArchive className="w-5 h-5" />}
              すべて保存 (ZIP)
            </button>
          )}

          {!allCompleted && (
            <button 
                onClick={handleProcessAll}
                disabled={isProcessing || mediaFiles.length === 0}
                className="bg-accent-video hover:bg-sky-600 text-white font-black px-10 py-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
            >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                一括変換を実行
            </button>
          )}
        </div>
      </div>

      {/* Progress & Processing Info */}
      {isProcessing && (
        <div className="bg-white border border-slate-100 p-8 rounded-3xl flex flex-col gap-5 shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold flex items-center gap-3 text-slate-800">
              <Loader2 className="w-5 h-5 animate-spin text-accent-video" />
              動画を最適化中...
            </h4>
            <span className="text-sm font-black font-mono text-accent-video">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
            <div 
              className="h-full bg-accent-video transition-all duration-300 ease-out shadow-[0_0_8px_rgba(2,132,199,0.3)]" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-center gap-8 py-2">
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <Smartphone className="w-3 h-3" /> Mobile Optimized
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <Music className="w-3 h-3" /> High Quality Audio
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto pr-3 flex flex-col gap-4 scrollbar-thin">
        {mediaFiles.map((mFile) => (
          <div 
            key={mFile.id}
            className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-5 group hover:shadow-md hover:border-slate-200 transition-all shadow-sm"
          >
            <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0 shadow-inner">
              {preset === "mp3_extract" ? (
                <Music className="w-6 h-6 text-indigo-300" />
              ) : (
                <Video className="w-6 h-6 text-sky-200" />
              )}
            </div>

            <div className="flex-1 min-w-0 text-left">
              <h4 className="font-black text-slate-800 truncate text-sm">{mFile.file.name}</h4>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-bold font-mono">
                <span className="px-1.5 py-0.5 bg-slate-100 rounded">{(mFile.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                
                {mFile.status === "pending" && mFile.duration && (
                  <span className="flex items-center gap-2">
                    <span className="text-slate-300">→</span>
                    <span className="text-sky-500 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 animate-pulse font-black">
                      約 {estimateSize(mFile)} MB
                    </span>
                  </span>
                )}

                {mFile.status === "completed" && mFile.resultSize && (
                  <span className="flex items-center gap-2">
                    <span className="text-slate-300">→</span>
                    <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-black">
                      {(mFile.resultSize / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </span>
                )}

                <span className="uppercase text-slate-300 px-1.5 py-0.5 border border-slate-50 rounded italic">
                  {mFile.file.type.split("/")[1] || "video"}
                  {mFile.duration && ` (${Math.floor(mFile.duration / 60)}:${Math.floor(mFile.duration % 60).toString().padStart(2, '0')})`}
                </span>
                
                {preset !== "none" && (
                   <span className="text-accent-video font-black uppercase tracking-tighter opacity-70">
                    Preset: {preset.replace("_", " ").toUpperCase()}
                   </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {mFile.status === "completed" && (
                <div className="flex items-center gap-1.5 text-accent-video bg-sky-50 px-4 py-2 rounded-xl border border-sky-100 shadow-sm animate-in zoom-in-95">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">SUCCESS</span>
                </div>
              )}
              {mFile.status === "processing" && <Loader2 className="w-4 h-4 animate-spin text-accent-video" />}
              
              {mFile.status === "completed" ? (
                <button 
                  onClick={() => handleDownload(mFile)}
                  className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl border border-slate-800 transition-all shadow-md group/dl active:scale-95"
                  title="Download"
                >
                  <Download className="w-5 h-5 group-hover/dl:scale-110 transition-transform" />
                </button>
              ) : (
                <button 
                  onClick={() => convertVideo(mFile)}
                  disabled={isProcessing}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl border border-slate-200 transition-all disabled:opacity-30 active:scale-95"
                  title="Convert"
                >
                  <PlayCircle className="w-5 h-5" />
                </button>
              )}
              
              <button 
                onClick={() => setMediaFiles(prev => prev.filter(f => f.id !== mFile.id))}
                className="text-slate-300 hover:text-red-500 p-2 transition-colors disabled:opacity-0"
                disabled={isProcessing}
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
