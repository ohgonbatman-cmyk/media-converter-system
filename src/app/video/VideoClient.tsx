"use client";

import React, { useState } from "react";
import { ConverterLayout } from "@/components/ConverterLayout";
import { FileUploader } from "@/components/FileUploader";
import { VideoConverter } from "@/components/VideoConverter";
import { Zap, Music, Smartphone, Info } from "lucide-react";

export default function VideoClient() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleReset = () => {
    setSelectedFiles([]);
  };

  return (
    <ConverterLayout 
      category="Video Converter"
      title="動画コンバーター & 高速圧縮"
      description="MP4, WebM への変換と、デバイス別の最適化プリセット。ブラウザ上で動作するため、大容量動画のアップロード不要。"
      color="bg-sky-500"
    >
      <div className="flex flex-col gap-12 h-full">
        {selectedFiles.length > 0 ? (
          <VideoConverter files={selectedFiles} onReset={handleReset} />
        ) : (
          <>
            <FileUploader 
              onFileSelect={handleFileSelect} 
              accept=".mp4,.webm,.mov,.avi" 
              color="bg-sky-500" 
              label="動画変換を開始" 
            />

            {/* SEO & Feature Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-center border-b-4 border-b-slate-100">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl shadow-inner">
                    <Smartphone className="w-8 h-8 text-sky-600" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 mb-3 text-xl tracking-tight">
                      デバイス別プリセット設定
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      「iPhone用」「YouTube用」「TikTok用」など、投稿先に最適な解像度やビットレートを自動で選択。専門知識がなくても、最高品質の動画を手軽に作成できます。
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-center border-b-4 border-b-slate-100">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-inner">
                    <Music className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 mb-3 text-xl tracking-tight">
                      動画から音声（MP3）を抽出
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      「動画 音声 抜き出し」機能により、動画から音声トラックを高品質に抽出。ポッドキャスト作成や音楽制作の素材作りにも最適です。ワンクリックでMP3変換が可能。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress & UX Section */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-12 rounded-[3rem] text-white overflow-hidden relative shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Zap className="w-48 h-48 text-white rotate-12" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3 tracking-tight">
                  < Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
                  リアルタイムの進捗表示で安心
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed max-w-2xl font-medium mb-8">
                  動画変換は時間がかかる作業です。当コンバーターは、独自の並列処理エンジン（FFmpeg.wasm）を搭載し、変換プロセスをパーセンテージで表示します。
                  ブラウザ内で動作するため、ネットワークの切断でアップロードがやり直しになる心配もありません。
                </p>
                <div className="flex gap-4">
                  <div className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">High Performance</div>
                  <div className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">No Upload Limits</div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <article className="prose prose-slate max-w-none bg-white/50 border border-slate-100 p-12 rounded-[2.5rem]">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <Info className="w-6 h-6 text-slate-400" /> 
                TikTok・YouTube投稿者の必須ツール
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">MP4 MOV 変換の利便性</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    スマホで撮影したMOV形式を、互換性の高いMP4に素早く変換。編集ソフトへの読み込みトラブルを未然に防ぎます。
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">プライバシーとセキュリティ</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    仕事で扱う機密動画も、外部サーバーを介さずに自分のPCで変換できるため、情報漏洩のリスクをゼロに抑えられます。
                  </p>
                </div>
              </div>
            </article>
          </>
        )}
      </div>
    </ConverterLayout>
  );
}
