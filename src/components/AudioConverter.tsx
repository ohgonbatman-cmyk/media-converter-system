"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Music, CheckCircle, Loader2, PlayCircle, FileArchive, Play } from "lucide-react";
import { useFFmpeg } from "@/hooks/useFFmpeg";
import { fetchFile } from "@ffmpeg/util";
import JSZip from "jszip";

interface MediaFile {
  file: File;
  id: string;
  status: "pending" | "processing" | "completed" | "error";
  resultUrl?: string;
}

interface AudioConverterProps {
  files: File[];
  onReset: () => void;
}

export const AudioConverter: React.FC<AudioConverterProps> = ({ files, onReset }) => {
  const { load, progress, resetProgress } = useFFmpeg();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>("mp3");
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
  }, [files]);

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
      const args = ["-i", inputName, outputName];
      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(new Blob([(data as any).buffer], { type: `audio/${targetFormat}` }));

      setMediaFiles(prev => prev.map(f => f.id === mediaFile.id ? { ...f, status: "completed", resultUrl: url } : f));
      
      // Cleanup
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
      <div className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-wrap items-center gap-6 shadow-sm ring-1 ring-slate-50">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left leading-none">出力形式</label>
          <select 
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            disabled={isProcessing}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-audio/20"
          >
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
            <option value="aac">AAC</option>
            <option value="ogg">OGG</option>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <button onClick={onReset} className="text-slate-400 hover:text-slate-600 text-sm font-bold px-4">
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
                className="bg-accent-audio hover:bg-indigo-700 text-white font-black px-10 py-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
            >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                一括変換を実行
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {isProcessing && (
        <div className="bg-white border border-slate-100 p-8 rounded-3xl flex flex-col gap-5 shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="font-bold flex items-center gap-3 text-slate-800">
              <Loader2 className="w-5 h-5 animate-spin text-accent-audio" />
              音声を処理中...
            </h4>
            <span className="text-sm font-black font-mono text-accent-audio">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
            <div 
              className="h-full bg-accent-audio transition-all duration-300 shadow-[0_0_8px_rgba(79,70,229,0.3)]" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-3 scrollbar-thin">
        {mediaFiles.map((mFile) => (
          <div 
            key={mFile.id}
            className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-5 group hover:shadow-md hover:border-slate-200 transition-all shadow-sm"
          >
            <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
              <Music className="w-6 h-6 text-slate-300" />
            </div>

            <div className="flex-1 min-w-0 text-left">
              <h4 className="font-black text-slate-800 truncate text-sm">{mFile.file.name}</h4>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-bold font-mono">
                <span className="px-1.5 py-0.5 bg-slate-100 rounded">{(mFile.file.size / 1024).toFixed(1)} KB</span>
                <span className="uppercase text-slate-300">{mFile.file.type.split("/")[1] || "audio"}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {mFile.status === "completed" && (
                <div className="flex items-center gap-1.5 text-accent-audio bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">SUCCESS</span>
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
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl border border-slate-200 transition-all disabled:opacity-30"
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
