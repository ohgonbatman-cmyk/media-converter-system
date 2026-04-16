"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Music, CheckCircle, Loader2, PlayCircle, FileArchive, Play, Settings2 } from "lucide-react";
import { useFFmpeg } from "@/hooks/useFFmpeg";
import { fetchFile } from "@ffmpeg/util";
import JSZip from "jszip";
import { reportConversionScale } from "@/lib/stats";

interface MediaFile {
  file: File;
  id: string;
  status: "pending" | "processing" | "completed" | "error";
  resultUrl?: string;
  duration?: number;
  resultSize?: number;
}

interface AudioConverterProps {
  files: File[];
  onReset: () => void;
  lang: string;
  dict: any;
  mode?: "converter" | "compressor";
}

export const AudioConverter: React.FC<AudioConverterProps> = ({ files, onReset, lang, dict, mode = "converter" }) => {
  const { load, progress, resetProgress } = useFFmpeg();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>("mp3");
  const [targetBitrate, setTargetBitrate] = useState<string>(mode === "compressor" ? "96k" : "192k");
  const [targetSampleRate, setTargetSampleRate] = useState<string>("44100");
  const [isMono, setIsMono] = useState<boolean>(mode === "compressor");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [ffmpegInstance, setFfmpegInstance] = useState<any>(null);

  useEffect(() => {
    const newFiles = files.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: "pending" as const,
    }));
    setMediaFiles(newFiles);

    // Get durations
    newFiles.forEach(mFile => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(mFile.file);
      audio.onloadedmetadata = () => {
        setMediaFiles(prev => prev.map(p => p.id === mFile.id ? { ...p, duration: audio.duration } : p));
        URL.revokeObjectURL(audio.src);
      };
    });
  }, [files]);

  const estimateSize = (mFile: MediaFile) => {
    if (!mFile.duration) return null;
    
    let bps = 0;
    if (targetFormat === "wav") {
      // WAV: SampleRate * 16bit * 2ch
      bps = parseInt(targetSampleRate) * 16 * 2;
    } else if (targetFormat === "flac") {
      // FLAC: Roughly 60% of WAV
      bps = parseInt(targetSampleRate) * 16 * 2 * 0.6;
    } else {
      // Lossy: Bitrate (Approximate for mono/stereo)
      bps = parseInt(targetBitrate.replace("k", "")) * 1000;
      if (isMono) bps = bps * 0.8; // Rough adjustment for mono perception/overhead
    }
    
    const sizeBytes = (bps * mFile.duration) / 8;
    const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(2);
    return dict.audio.est_size.replace("{size}", sizeMb);
  };

  const convertAudio = async (mediaFile: MediaFile) => {
    const ffmpeg = ffmpegInstance || await load();
    if (!ffmpegInstance) setFfmpegInstance(ffmpeg);
    
    setIsProcessing(true);
    resetProgress();
    
    setMediaFiles(prev => prev.map(f => f.id === mediaFile.id ? { ...f, status: "processing" } : f));

    try {
      const inputName = "audio_in_" + mediaFile.file.name;
      const outputName = `audio_out_${mediaFile.id}.${targetFormat}`;

      await ffmpeg.writeFile(inputName, await fetchFile(mediaFile.file));
      
      const args = ["-i", inputName];
      if (["mp3", "aac", "ogg"].includes(targetFormat)) {
        args.push("-b:a", targetBitrate);
      }
      if (isMono) {
        args.push("-ac", "1");
      }
      args.push("-ar", targetSampleRate);
      args.push(outputName);
      
      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputName);
      const size = (data as Uint8Array).length;
      const mimeType = targetFormat === "mp3" ? "audio/mpeg" : `audio/${targetFormat}`;
      const url = URL.createObjectURL(new Blob([(data as any).buffer], { type: mimeType }));

      setMediaFiles(prev => prev.map(f => f.id === mediaFile.id ? { ...f, status: "completed", resultUrl: url, resultSize: size } : f));
      
      // 個別変換時の統計報告
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

    setIsProcessingAll(true);
    for (const mFile of pendingFiles) {
        await convertAudio(mFile);
    }

    // 全体の統計をまとめて報告
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
        zip.file(`${fileName}.${targetFormat}`, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    if (typeof document !== "undefined") {
      const a = document.createElement("a");
      a.href = url;
      a.download = `converted_audio_${new Date().getTime()}.zip`;
      a.click();
    }
    URL.revokeObjectURL(url);
    setIsZipping(false);
  };

  const handleDownload = (mFile: MediaFile) => {
    if (!mFile.resultUrl || typeof document === "undefined") return;
    const a = document.createElement("a");
    const originalName = mFile.file.name.substring(0, mFile.file.name.lastIndexOf("."));
    a.href = mFile.resultUrl;
    a.download = `${originalName}.${targetFormat}`;
    a.click();
  };

  const anyCompleted = mediaFiles.some(f => f.status === "completed");
  const allCompleted = mediaFiles.length > 0 && mediaFiles.every(f => f.status === "completed");
  const completedCount = mediaFiles.filter(f => f.status === "completed").length;

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Options Bar */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2.5rem] md:rounded-[2.5rem] flex flex-col gap-8 shadow-sm ring-1 ring-slate-100 font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col gap-2 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{dict.audio.format_label}</label>
            <select 
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              disabled={isProcessing}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-audio/20 transition-all"
            >
              <option value="mp3">MP3</option>
              <option value="wav">WAV (高音質)</option>
              <option value="flac">FLAC (無劣化)</option>
              <option value="aac">AAC</option>
              <option value="ogg">OGG</option>
            </select>
          </div>

          {["mp3", "aac", "ogg"].includes(targetFormat) && (
            <div className="flex flex-col gap-2 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{dict.audio.bitrate_label}</label>
              <select 
                value={targetBitrate}
                onChange={(e) => setTargetBitrate(e.target.value)}
                disabled={isProcessing}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-audio/20 transition-all"
              >
                <option value="128k">128 kbps</option>
                <option value="192k">192 kbps</option>
                <option value="256k">256 kbps</option>
                <option value="320k">320 kbps (最高)</option>
                {mode === "compressor" && (
                  <>
                    <option value="96k">96 kbps (Economy)</option>
                    <option value="64k">64 kbps (Max Compression)</option>
                  </>
                )}
              </select>
            </div>
          )}

          {mode === "compressor" && (
            <div className="flex flex-col gap-2 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Channels</label>
              <button 
                onClick={() => setIsMono(!isMono)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold transition-all h-[46px] ${
                  isMono 
                  ? "bg-amber-50 border-amber-200 text-amber-700" 
                  : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                {isMono ? "Mono (Smallest)" : "Stereo"}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{dict.audio.samplerate_label}</label>
            <select 
              value={targetSampleRate}
              onChange={(e) => setTargetSampleRate(e.target.value)}
              disabled={isProcessing}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-audio/20 transition-all"
            >
              <option value="44100">44.1 kHz (標準)</option>
              <option value="48000">48 kHz (映像制作向け)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-400 mr-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
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
              disabled={isZipping || isProcessing}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm flex-1 sm:flex-none min-w-[160px]"
            >
              {isZipping ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : (
                completedCount === 1 ? <Download className="w-4 h-4 sm:w-5 sm:h-5" /> : <FileArchive className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              {completedCount === 1 ? dict.common.download : dict.audio.download_all}
            </button>
          )}

          {!allCompleted && (
            <button 
                onClick={handleProcessAll}
                disabled={isProcessing || mediaFiles.length === 0}
                className="bg-accent-audio hover:bg-indigo-700 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-xs sm:text-sm flex-1 sm:flex-none min-w-[200px]"
            >
                {isProcessing ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Music className="w-4 h-4 sm:w-5 sm:h-5" />}
                {mode === "compressor" ? (dict.video.process_compress || "Start Compression") : dict.audio.process_all}
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {isProcessing && (
        <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-[2rem] md:rounded-3xl flex flex-col gap-5 shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold flex items-center gap-3 text-slate-800 text-sm md:text-base">
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-accent-audio" />
              {dict.audio.processing_label}
            </h4>
            <span className="text-xs md:text-sm font-black font-mono text-accent-audio">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
            <div 
              className="h-full bg-accent-audio transition-all duration-300 shadow-[0_0_8px_rgba(79,70,229,0.3)]" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-1 scale-90 opacity-70">
            {dict.audio.security_notice}
          </p>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-3 scrollbar-thin">
        {mediaFiles.map((mFile) => (
          <div 
            key={mFile.id}
            className="bg-white border border-slate-100 p-4 md:p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 md:gap-5 group hover:shadow-md hover:border-slate-200 transition-all shadow-sm"
          >
            <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0 shadow-inner">
              <Music className="w-5 h-5 md:w-6 md:h-6 text-slate-300" />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left w-full">
              <h4 className="font-black text-slate-800 truncate text-xs md:text-sm">{mFile.file.name}</h4>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 md:gap-3 mt-1.5 text-[9px] md:text-[10px] text-slate-400 font-bold font-mono">
                <span className="px-1.5 py-0.5 bg-slate-100 rounded">{(mFile.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                
                {mFile.status === "pending" && mFile.duration && (
                  <span className="flex items-center gap-2">
                    <span className="text-slate-300">→</span>
                    <span className="text-accent-audio bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 animate-pulse">
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
                
                <span className="uppercase text-slate-300 px-1.5 py-0.5 border border-slate-50 rounded italic whitespace-nowrap">
                  {mFile.file.type.split("/")[1] || "audio"} 
                  {mFile.duration && ` (${Math.floor(mFile.duration / 60)}:${Math.floor(mFile.duration % 60).toString().padStart(2, '0')})`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto justify-center sm:justify-end border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0 mt-2 sm:mt-0">
              {mFile.status === "completed" && (
                <div className="flex items-center gap-1.5 text-accent-audio bg-indigo-50 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-indigo-100 shadow-sm animate-in zoom-in-95">
                  <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">{dict.audio.success}</span>
                </div>
              )}
              {mFile.status === "processing" && <Loader2 className="w-4 h-4 animate-spin text-accent-audio" />}
              
              {mFile.status === "completed" ? (
                <button 
                  onClick={() => handleDownload(mFile)}
                  className="bg-slate-900 hover:bg-slate-800 text-white p-2.5 md:p-3 rounded-lg md:rounded-xl border border-slate-800 transition-all shadow-md group/dl active:scale-95"
                >
                  <Download className="w-4 h-4 md:w-5 md:h-5 group-hover/dl:scale-110 transition-transform" />
                </button>
              ) : (
                <button 
                  onClick={() => convertAudio(mFile)}
                  disabled={isProcessing}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2.5 md:p-3 rounded-lg md:rounded-xl border border-slate-200 transition-all disabled:opacity-30 active:scale-95"
                  title="Convert"
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
