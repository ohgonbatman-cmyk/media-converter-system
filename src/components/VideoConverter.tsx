"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, X, Video, CheckCircle, Loader2, PlayCircle, FileArchive, Play, Smartphone, Music } from "lucide-react";
import { useFFmpeg } from "@/hooks/useFFmpeg";
import { fetchFile } from "@ffmpeg/util";
import JSZip from "jszip";
import { reportConversionScale } from "@/lib/stats";
import { trackEvent } from "@/lib/tracking";
import { TikTokPreview } from "./TikTokPreview";
import { LayoutGrid, Maximize, Layers } from "lucide-react";

interface MediaFile {
  file: File;
  id: string;
  status: "pending" | "loading" | "processing" | "completed" | "error";
  resultUrl?: string;
  progress: number;
  duration?: number;
  resultSize?: number;
  width?: number;
  height?: number;
}

interface VideoConverterProps {
  files: File[];
  onReset: () => void;
  lang: string;
  dict: any;
  mode?: "converter" | "compressor";
}

type Preset = "none" | "iphone" | "youtube" | "tiktok" | "mp3_extract";
type TikTokMode = "crop" | "letterbox" | "blur";

export const VideoConverter: React.FC<VideoConverterProps> = ({ files, onReset, lang, dict, mode = "converter" }) => {
  const { load, progress, resetProgress } = useFFmpeg();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>("mp4");
  const [preset, setPreset] = useState<Preset>(mode === "compressor" ? "iphone" : "none");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [ffmpegInstance, setFfmpegInstance] = useState<any>(null);
  const [tiktokMode, setTiktokMode] = useState<TikTokMode>("crop");
  const [tiktokOffset, setTiktokOffset] = useState<number>(50);

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
      if (typeof document === "undefined") return;
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = URL.createObjectURL(mFile.file);
      video.onloadedmetadata = () => {
        setMediaFiles(prev => prev.map(p => p.id === mFile.id ? { 
          ...p, 
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        } : p));
        URL.revokeObjectURL(video.src);
      };
    });
  }, [files]);

  const estimateSize = (mFile: MediaFile) => {
    if (!mFile.duration) return null;
    
    let totalBps = 0;
    if (mode === "compressor") {
        totalBps = 1500000; // ~1.5Mbps for optimized compression
    } else {
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
              totalBps = 320000; // 320kbps
              break;
            default:
              totalBps = 2000000; // ~2Mbps standard
          }
    }
    
    const sizeBytes = (totalBps * mFile.duration) / 8;
    const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
    return dict.video.est_size.replace("{size}", sizeMb);
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
      
      const args: string[] = ["-i", inputName];
      
      if (mode === "compressor") {
        if (targetFormat === "mp4" || targetFormat === "mov") {
          args.push("-c:v", "libx264", "-crf", "28", "-preset", "fast", "-c:a", "aac", "-b:a", "96k");
        } else if (targetFormat === "webm") {
          args.push("-c:v", "libvpx-vp9", "-crf", "35", "-b:v", "0", "-c:a", "libopus");
        }
      } else {
        switch (preset) {
          case "iphone":
            args.push("-c:v", "libx264", "-crf", "23", "-preset", "fast", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart");
            break;
          case "youtube":
            args.push("-c:v", "libx264", "-crf", "18", "-preset", "fast", "-c:a", "aac", "-b:a", "384k");
            break;
          case "tiktok": {
            // TikTok Mode Logic
            if (tiktokMode === "crop") {
              const offsetVal = tiktokOffset / 100;
              args.push("-vf", `crop='if(gt(a,9/16),ih*9/16,iw)':'if(gt(a,9/16),ih,iw*16/9)':'if(gt(a,9/16),(iw-ow)*${offsetVal},(iw-ow)/2)':'if(gt(a,9/16),(ih-oh)/2,(ih-oh)*${offsetVal})',scale=1080:1920`, "-c:v", "libx264", "-crf", "23", "-preset", "fast", "-c:a", "aac", "-b:a", "128k");
            } else if (tiktokMode === "letterbox") {
              args.push("-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black", "-c:v", "libx264", "-crf", "23", "-preset", "fast", "-c:a", "aac", "-b:a", "128k");
            } else if (tiktokMode === "blur") {
              args.push("-vf", "split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:10[bg];[b]scale=1080:ih*1080/iw[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2", "-c:v", "libx264", "-crf", "23", "-preset", "fast", "-c:a", "aac", "-b:a", "128k");
            }
            break;
          }
          case "mp3_extract":
            args.push("-vn", "-c:a", "libmp3lame", "-b:a", "320k");
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
      }

      args.push(outputName);
      
      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputName);
      const size = (data as Uint8Array).length;
      const mimeType = preset === "mp3_extract" ? "audio/mpeg" : `video/${currentOutputFormat}`;
      const url = URL.createObjectURL(new Blob([data as any], { type: mimeType }));

      setMediaFiles(prev => prev.map(f => f.id === mediaFile.id ? { ...f, status: "completed", resultUrl: url, progress: 100, resultSize: size } : f));
      
      // 統計報告
      if (!isProcessingAll) {
        reportConversionScale(1, size);
      }

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

    trackEvent(mode === "compressor" ? "start_compression" : "start_conversion", {
      media_type: "video",
      count: pendingFiles.length,
      target_format: targetFormat,
      preset: preset
    });

    setIsProcessingAll(true);
    for (const mFile of pendingFiles) {
        await convertVideo(mFile);
    }

    const results = await new Promise<MediaFile[]>(resolve => {
      setMediaFiles(prev => {
        resolve(prev);
        return prev;
      });
    });
    const newlyDone = results.filter(f => pendingFiles.some(p => p.id === f.id) && f.status === "completed" && f.resultSize);
    if (newlyDone.length > 0) {
      const totalSize = newlyDone.reduce((acc, curr) => acc + (curr.resultSize || 0), 0);
      reportConversionScale(newlyDone.length, totalSize);
    }
    setIsProcessingAll(false);
  };

  const handleDownloadAll = async () => {
    const completedFiles = mediaFiles.filter(f => f.status === "completed" && f.resultUrl);
    if (completedFiles.length === 0) return;

    trackEvent("download_result", {
      media_type: "video",
      is_zip: completedFiles.length > 1,
      count: completedFiles.length
    });

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
        const ext = preset === "mp3_extract" ? "mp3" : targetFormat;
        zip.file(`${fileName}.${ext}`, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    if (typeof document !== "undefined") {
      const a = document.createElement("a");
      a.href = url;
      a.download = `converted_videos_${new Date().getTime()}.zip`;
      a.click();
    }
    URL.revokeObjectURL(url);
    setIsZipping(false);
  };

  const handleDownload = (mFile: MediaFile) => {
    if (!mFile.resultUrl || typeof document === "undefined") return;

    const completedFiles = mediaFiles.filter(f => f.status === "completed" && f.resultUrl);
    if (completedFiles.length !== 1 || !isProcessingAll) {
       trackEvent("download_result", {
         media_type: "video",
         is_zip: false,
         count: 1
       });
    }

    const a = document.createElement("a");
    const originalName = mFile.file.name.substring(0, mFile.file.name.lastIndexOf("."));
    const ext = preset === "mp3_extract" ? "mp3" : targetFormat;
    a.href = mFile.resultUrl;
    a.download = `${originalName}.${ext}`;
    a.click();
  };

  const anyCompleted = mediaFiles.some(f => f.status === "completed");
  const allCompleted = mediaFiles.length > 0 && mediaFiles.every(f => f.status === "completed");
  const completedCount = mediaFiles.filter(f => f.status === "completed").length;

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Options Bar */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2.5rem] md:rounded-[2.5rem] flex flex-col gap-8 shadow-sm ring-1 ring-slate-100 font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{dict.video.format_label}</label>
            <select 
              value={targetFormat}
              onChange={(e) => {
                setTargetFormat(e.target.value);
                if (preset === "mp3_extract") setPreset("none");
              }}
              disabled={isProcessing || preset === "mp3_extract"}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-video/20 transition-all disabled:opacity-50"
            >
              <option value="mp4">MP4 (H.264)</option>
              <option value="webm">WebM (VP9)</option>
              <option value="mov">MOV (QuickTime)</option>
            </select>
          </div>

          {mode === "converter" && (
            <div className="flex flex-col gap-2 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{dict.video.preset_label}</label>
              <select 
                value={preset}
                onChange={(e) => setPreset(e.target.value as Preset)}
                disabled={isProcessing}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-video/20 transition-all"
              >
                <option value="none">{dict.video.preset_none}</option>
                <option value="iphone">{dict.video.preset_iphone}</option>
                <option value="youtube">{dict.video.preset_youtube}</option>
                <option value="tiktok">{dict.video.preset_tiktok}</option>
                <option value="mp3_extract">{dict.video.preset_mp3}</option>
              </select>
            </div>
          )}

          {mode === "compressor" && (
            <div className="flex flex-col gap-2 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{dict.image.reduction_label || "Compression Level"}</label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black text-sky-600 flex items-center gap-2 h-[46px]">
                <Smartphone className="w-3.5 h-3.5" /> High Efficiency
              </div>
            </div>
          )}
        </div>

        {/* TikTok Mode Selection */}
        {preset === "tiktok" && (
          <div className="flex flex-col gap-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex flex-col gap-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                {dict.video.tiktok_modes_label}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "crop", icon: LayoutGrid, label: dict.video.tiktok_mode_crop, desc: dict.video.tiktok_mode_crop_desc },
                  { id: "letterbox", icon: Maximize, label: dict.video.tiktok_mode_letterbox, desc: dict.video.tiktok_mode_letterbox_desc },
                  { id: "blur", icon: Layers, label: dict.video.tiktok_mode_blur, desc: dict.video.tiktok_mode_blur_desc }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setTiktokMode(m.id as TikTokMode)}
                    disabled={isProcessing}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                      tiktokMode === m.id 
                        ? "border-sky-500 bg-sky-50 shadow-inner" 
                        : "border-slate-100 bg-slate-50 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${tiktokMode === m.id ? "bg-sky-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                       <m.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-tight text-slate-900">{m.label}</div>
                      <div className="text-[8px] font-bold text-slate-400 mt-1 leading-tight">{m.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-400 mr-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">{dict.common.local_process}</span>
          </div>

          <button 
            onClick={() => {
              trackEvent("cancel_operation", { media_type: "video" });
              onReset();
            }} 
            className="text-slate-400 hover:text-slate-600 text-xs sm:text-sm font-bold px-6 py-2 transition-colors uppercase tracking-tight"
          >
            {dict.common.cancel}
          </button>
          
          {anyCompleted && (
            <button 
              onClick={handleDownloadAll}
              disabled={isZipping || isProcessing}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm flex-1 sm:flex-none min-w-[160px]"
            >
              {isZipping ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : (
                completedCount === 1 ? <Download className="w-4 h-4 sm:w-5 sm:h-5" /> : <FileArchive className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              {completedCount === 1 ? dict.common.download : dict.video.download_all}
            </button>
          )}

          {!allCompleted && (
            <button 
                onClick={handleProcessAll}
                disabled={isProcessing || mediaFiles.length === 0}
                className="bg-accent-video hover:bg-sky-600 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-xs sm:text-sm flex-1 sm:flex-none min-w-[200px]"
            >
                {isProcessing ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
                {mode === "compressor" ? (dict.video.process_compress || "Start Compression") : dict.video.process_all}
            </button>
          )}
        </div>
      </div>

      {/* Progress Info */}
      {isProcessing && (
        <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-[2rem] md:rounded-3xl flex flex-col gap-5 shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold flex items-center gap-3 text-slate-800 text-sm md:text-base">
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-accent-video" />
              {dict.video.processing_label}
            </h4>
            <span className="text-xs md:text-sm font-black font-mono text-accent-video">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
            <div 
              className="h-full bg-accent-video transition-all duration-300 ease-out shadow-[0_0_8px_rgba(2,132,199,0.3)]" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* TikTok Preview Section */}
      {preset === "tiktok" && mediaFiles.length > 0 && !isProcessing && (
        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl animate-in fade-in zoom-in-95 duration-700 ring-1 ring-slate-100">
          <TikTokPreview 
            file={mediaFiles[0].file} 
            onOffsetChange={setTiktokOffset} 
            mode={tiktokMode} 
            dict={dict}
          />
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto pr-3 flex flex-col gap-4 scrollbar-thin">
        {mediaFiles.map((mFile) => (
          <div 
            key={mFile.id}
            className="bg-white border border-slate-100 p-4 md:p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 md:gap-5 group hover:shadow-md hover:border-slate-200 transition-all shadow-sm"
          >
            <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0 shadow-inner">
              {preset === "mp3_extract" ? (
                <Music className="w-6 h-6 text-indigo-300" />
              ) : (
                <Video className="w-6 h-6 text-sky-200" />
              )}
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left w-full">
              <h4 className="font-black text-slate-800 truncate text-xs md:text-sm">{mFile.file.name}</h4>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 md:gap-3 mt-1.5 text-[9px] md:text-[10px] text-slate-400 font-bold font-mono">
                <span className="px-1.5 py-0.5 bg-slate-100 rounded">{(mFile.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                
                {mFile.status === "pending" && mFile.duration && (
                  <span className="flex items-center gap-2">
                    <span className="text-slate-300">→</span>
                    <span className="text-sky-500 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 animate-pulse font-black">
                      {estimateSize(mFile)}
                    </span>
                  </span>
                )}

                {mFile.status === "completed" && mFile.resultSize && (
                  <span className="flex items-center gap-2">
                    <span className="text-slate-300">→</span>
                    <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-black flex items-center gap-1.5 animate-in slide-in-from-left-1 duration-500">
                      {(mFile.resultSize / (1024 * 1024)).toFixed(2)} MB
                      {mFile.file.size > mFile.resultSize && (
                        <span className="text-[8px] bg-emerald-500 text-white px-1 rounded-sm scale-90 origin-right animate-pulse">
                          -{Math.round((1 - mFile.resultSize / mFile.file.size) * 100)}%
                        </span>
                      )}
                    </span>
                  </span>
                )}

                <span className="uppercase text-slate-300 px-1.5 py-0.5 border border-slate-50 rounded italic">
                  {mFile.file.type.split("/")[1] || "video"}
                  {mFile.duration && ` (${Math.floor(mFile.duration / 60)}:${Math.floor(mFile.duration % 60).toString().padStart(2, '0')})`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto justify-center sm:justify-end border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0 mt-2 sm:mt-0">
              {mFile.status === "completed" && (
                <div className="flex items-center gap-1.5 text-accent-video bg-sky-50 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-sky-100 shadow-sm animate-in zoom-in-95">
                  <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">{dict.video.success}</span>
                </div>
              )}
              {mFile.status === "processing" && <Loader2 className="w-4 h-4 animate-spin text-accent-video" />}
              
              {mFile.status === "completed" ? (
                <button 
                  onClick={() => {
                    trackEvent("download_result", { media_type: "video", is_zip: false, count: 1 });
                    handleDownload(mFile);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white p-2.5 md:p-3 rounded-lg md:rounded-xl border border-slate-800 transition-all shadow-md group/dl active:scale-95"
                >
                  <Download className="w-4 h-4 md:w-5 md:h-5 group-hover/dl:scale-110 transition-transform" />
                </button>
              ) : (
                <button 
                  onClick={() => {
                    trackEvent(mode === "compressor" ? "start_compression" : "start_conversion", {
                      media_type: "video",
                      count: 1,
                      target_format: targetFormat,
                      preset: preset
                    });
                    convertVideo(mFile);
                  }}
                  disabled={isProcessing}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2.5 md:p-3 rounded-lg md:rounded-xl border border-slate-200 transition-all disabled:opacity-30 active:scale-95"
                >
                  <PlayCircle className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              )}
              
              <button 
                onClick={() => setMediaFiles(prev => prev.filter(f => f.id !== mFile.id))}
                className="text-slate-300 hover:text-red-500 p-2 transition-colors disabled:opacity-0"
                disabled={isProcessing}
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
