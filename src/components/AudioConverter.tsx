"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Music, CheckCircle, Loader2, PlayCircle, FileArchive, Play, Settings2 } from "lucide-react";
import { useFFmpeg } from "@/hooks/useFFmpeg";
import { fetchFile } from "@ffmpeg/util";
import JSZip from "jszip";

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
}

export const AudioConverter: React.FC<AudioConverterProps> = ({ files, onReset, lang, dict }) => {
  const { load, progress, resetProgress } = useFFmpeg();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>("mp3");
  const [targetBitrate, setTargetBitrate] = useState<string>("192k");
  const [targetSampleRate, setTargetSampleRate] = useState<string>("44100");
  const [isProcessing, setIsProcessing] = useState(false);
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
      // Lossy: Bitrate
      bps = parseInt(targetBitrate.replace("k", "")) * 1000;
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
      args.push("-ar", targetSampleRate);
      args.push(outputName);
      
      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputName);
      const size = (data as Uint8Array).length;
      const mimeType = targetFormat === "mp3" ? "audio/mpeg" : `audio/${targetFormat}`;
      const url = URL.createObjectURL(new Blob([(data as any).buffer], { type: mimeType }));

      setMediaFiles(prev => prev.map(f => f.id === mediaFile.id ? { ...f, status: "completed", resultUrl: url, resultSize: size } : f));
      
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
        await convertAudio(mFile);
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
        zip.file(`${fileName}.${targetFormat}`, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted_audio_${new Date().getTime()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setIsZipping(false);
  };

  const handleDownload = (mFile: MediaFile) => {
    if (!mFile.resultUrl) return;
    const a = document.createElement("a");
    const originalName = mFile.file.name.substring(0, mFile.file.name.lastIndexOf("."));
    a.href = mFile.resultUrl;
    a.download = `${originalName}.${targetFormat}`;
    a.click();
  };

  const anyCompleted = mediaFiles.some(f => f.status === "completed");
  const allCompleted = mediaFiles.length > 0 && mediaFiles.every(f => f.status === "completed");

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Options Bar */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-wrap items-center gap-6 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left leading-none">{dict.audio.format_label}</label>
          <select 
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            disabled={isProcessing}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-audio/20 transition-all"
          >
            <option value="mp3">MP3</option>
            <option value="wav">WAV (高音質)</option>
            <option value="flac">FLAC (無劣化)</option>
            <option value="aac">AAC</option>
            <option value="ogg">OGG</option>
          </select>
        </div>

        {["mp3", "aac", "ogg"].includes(targetFormat) && (
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left leading-none">{dict.audio.bitrate_label}</label>
            <select 
              value={targetBitrate}
              onChange={(e) => setTargetBitrate(e.target.value)}
              disabled={isProcessing}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-audio/20 transition-all"
            >
              <option value="128k">128 kbps</option>
              <option value="192k">192 kbps</option>
              <option value="256k">256 kbps</option>
              <option value="320k">320 kbps (最高)</option>
            </select>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left leading-none">{dict.audio.samplerate_label}</label>
          <select 
            value={targetSampleRate}
            onChange={(e) => setTargetSampleRate(e.target.value)}
            disabled={isProcessing}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-audio/20 transition-all"
          >
            <option value="44100">44.1 kHz (標準)</option>
            <option value="48000">48 kHz (映像制作向け)</option>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <button onClick={onReset} className="text-slate-400 hover:text-slate-600 text-sm font-bold px-4 transition-colors">
            {dict.common.cancel}
          </button>
          
          {anyCompleted && (
            <button 
              onClick={handleDownloadAll}
              disabled={isZipping || isProcessing}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-3.5 rounded-2xl transition-all shadow-lg flex items-center gap-2 text-sm"
            >
              {isZipping ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileArchive className="w-5 h-5" />}
              {dict.audio.download_all}
            </button>
          )}

          {!allCompleted && (
            <button 
                onClick={handleProcessAll}
                disabled={isProcessing || mediaFiles.length === 0}
                className="bg-accent-audio hover:bg-indigo-700 text-white font-black px-10 py-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
            >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                {dict.audio.process_all}
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {isProcessing && (
        <div className="bg-white border border-slate-100 p-8 rounded-3xl flex flex-col gap-5 shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold flex items-center gap-3 text-slate-800">
              <Loader2 className="w-5 h-5 animate-spin text-accent-audio" />
              {dict.audio.processing_label}
            </h4>
            <span className="text-sm font-black font-mono text-accent-audio">{progress}%</span>
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
            className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-5 group hover:shadow-md hover:border-slate-200 transition-all shadow-sm"
          >
            <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0 shadow-inner">
              <Music className="w-6 h-6 text-slate-300" />
            </div>

            <div className="flex-1 min-w-0 text-left">
              <h4 className="font-black text-slate-800 truncate text-sm">{mFile.file.name}</h4>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-bold font-mono">
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
                    <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-black">
                      {(mFile.resultSize / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </span>
                )}
                
                <span className="uppercase text-slate-300 px-1.5 py-0.5 border border-slate-50 rounded italic whitespace-nowrap">
                  {mFile.file.type.split("/")[1] || "audio"} 
                  {mFile.duration && ` (${Math.floor(mFile.duration / 60)}:${Math.floor(mFile.duration % 60).toString().padStart(2, '0')})`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {mFile.status === "completed" && (
                <div className="flex items-center gap-1.5 text-accent-audio bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm animate-in zoom-in-95">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">{dict.audio.success}</span>
                </div>
              )}
              {mFile.status === "processing" && <Loader2 className="w-4 h-4 animate-spin text-accent-audio" />}
              
              {mFile.status === "completed" ? (
                <button 
                  onClick={() => handleDownload(mFile)}
                  className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl border border-slate-800 transition-all shadow-md group/dl active:scale-95"
                >
                  <Download className="w-5 h-5 group-hover/dl:scale-110 transition-transform" />
                </button>
              ) : (
                <button 
                  onClick={() => convertAudio(mFile)}
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
