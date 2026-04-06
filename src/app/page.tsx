"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { FileUploader } from "@/components/FileUploader";
import { ImageConverter } from "@/components/ImageConverter";
import { VideoConverter } from "@/components/VideoConverter";
import { AudioConverter } from "@/components/AudioConverter";
import { ChevronRight, ShieldCheck, Zap } from "lucide-react";

type Mode = "image" | "video" | "audio";

export default function Home() {
  const [mode, setMode] = useState<Mode>("image");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleReset = () => {
    setSelectedFiles([]);
  };

  const getModeInfo = () => {
    switch (mode) {
      case "image":
        return { 
          title: "画像コンバーター", 
          desc: "PNG, JPG, WebP への変換とリサイズ", 
          color: "bg-accent-image",
          accept: ".png,.jpg,.jpeg,.webp"
        };
      case "video":
        return { 
          title: "動画コンバーター", 
          desc: "MP4, WebM への変換と動画圧縮", 
          color: "bg-accent-video",
          accept: ".mp4,.webm,.mov,.avi"
        };
      case "audio":
        return { 
          title: "音声コンバーター", 
          desc: "MP3, WAV, AAC への変換", 
          color: "bg-accent-audio",
          accept: ".mp3,.wav,.aac,.ogg"
        };
    }
  };

  const { title, desc, color, accept } = getModeInfo();

  const renderConverter = () => {
    switch (mode) {
      case "image":
        return <ImageConverter files={selectedFiles} onReset={handleReset} />;
      case "video":
        return <VideoConverter files={selectedFiles} onReset={handleReset} />;
      case "audio":
        return <AudioConverter files={selectedFiles} onReset={handleReset} />;
    }
  };

  return (
    <div className="flex h-full w-full bg-white select-none">
      {/* Sidebar */}
      <Sidebar 
        currentMode={mode} 
        onModeChange={(m) => { 
          setMode(m); 
          handleReset(); 
        }} 
      />

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden bg-[#fafafa] flex flex-col">
        {/* Header */}
        <header className="p-8 border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="max-w-5xl mx-auto w-full">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 leading-none">
              <span>Media Converter</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-900">{title}</span>
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">{title}</h2>
                <p className="text-slate-500 text-sm mt-1.5 font-medium">{desc}</p>
              </div>
              <div className="hidden md:flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 text-emerald-700">
                  <ShieldCheck className="w-3 h-3" /> SECURE
                </div>
                <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 text-amber-700">
                  <Zap className="w-3 h-3" /> FAST
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Workspace */}
        <section className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <div className="max-w-5xl mx-auto w-full h-full">
            {selectedFiles.length > 0 ? (
              renderConverter()
            ) : (
              <div className="flex flex-col gap-8 h-full">
                <FileUploader 
                  onFileSelect={handleFileSelect} 
                  accept={accept} 
                  color={color} 
                  label={`${title}を開始`} 
                />

                {/* Bottom Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8">
                  <div className="bg-white border border-slate-100 p-8 rounded-[2rem] flex flex-col justify-between min-h-[180px] shadow-sm hover:shadow-md transition-all group border-b-4 border-b-slate-100 active:translate-y-0.5">
                    <div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] block text-right mb-4">Marketplace</span>
                      <div className="w-full h-24 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center group-hover:bg-slate-100/50 transition-colors">
                        <span className="text-[10px] text-slate-400 font-mono text-center px-6 leading-relaxed">
                          Amazon Associate Banner Area<br />
                          <span className="opacity-50">(300 x 250 Recommend)</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-slate-100 p-10 rounded-[2rem] shadow-sm flex flex-col justify-center border-b-4 border-b-slate-100">
                    <div className="flex items-start gap-5">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner">
                        <ShieldCheck className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 mb-1.5 text-lg">
                          完全ローカル処理
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          このツールはブラウザー内部のみで動作します。変換中にファイルが外部へ送信されることは一切ありません。機密性の高いファイルも安心して処理可能です。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
