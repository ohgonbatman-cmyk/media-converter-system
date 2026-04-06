"use client";

import React, { useState } from "react";
import { ConverterLayout } from "@/components/ConverterLayout";
import { FileUploader } from "@/components/FileUploader";
import { AudioConverter } from "@/components/AudioConverter";
import { Music, Activity, Archive, Speaker, Info } from "lucide-react";

export default function AudioClient() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleReset = () => {
    setSelectedFiles([]);
  };

  return (
    <ConverterLayout 
      category="Audio Converter"
      title="音声コンバーター (プロ仕様設定)"
      description="MP3, WAV, AAC, OGG への詳細設定変換。ハイレゾ音源やビットレート固定など、音質重視の処理をブラウザだけで実現。"
      color="bg-indigo-500"
    >
      <div className="flex flex-col gap-12 h-full">
        {selectedFiles.length > 0 ? (
          <AudioConverter files={selectedFiles} onReset={handleReset} />
        ) : (
          <>
            <FileUploader 
              onFileSelect={handleFileSelect} 
              accept=".mp3,.wav,.aac,.ogg,.flac" 
              color="bg-indigo-500" 
              label="音声変換を開始" 
            />

            {/* SEO & Feature Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-center border-b-4 border-b-slate-100">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-inner">
                    <Speaker className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 mb-3 text-xl tracking-tight">
                      詳細な出力スペック指定
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      ビットレート **320kbps**, サンプリングレート **48kHz** といったプロフェッショナル仕様の数値を直接指定可能。オーディオマニアや配信者も納得のクオリティを保証します。
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-center border-b-4 border-b-slate-100">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-inner">
                    <Activity className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 mb-3 text-xl tracking-tight">
                      無劣化 (Lossless) 変換対応
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      FLACやWAVへの相互変換において、音質劣化を一切許さないロスレス変換をサポート。大切な「アルバム一括変換」も、音質を維持したままスピーディーに行えます。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Batch Processing Highlight */}
            <div className="bg-white border border-slate-200 border-dashed p-10 rounded-[2.5rem] flex items-center justify-between gap-10">
              <div className="flex-1">
                <div className="flex items-center gap-3 text-indigo-600 mb-4 tracking-widest text-[10px] font-black uppercase">
                  <Archive className="w-4 h-4" /> Batch Workflows
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">
                  アルバム1枚分を一括変換して、ZIPでまとめてダウンロード
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xl font-medium">
                  複数のオーディオファイルを一挙にドラッグ＆ドロップ。個別に変換設定をする手間を省き、最後はJSZipによる一括ダウンロードで作業を完結させることができます。
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="w-48 h-48 bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center justify-center rotate-3 shadow-inner">
                  <Music className="w-20 h-20 text-slate-200" />
                </div>
              </div>
            </div>

            {/* Content Section */}
            <article className="prose prose-slate max-w-none bg-white/50 border border-slate-100 p-12 rounded-[2.5rem]">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <Info className="w-6 h-6 text-slate-400" /> 
                音楽制作・ポッドキャストに最適
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">WAV MP3 変換の正確さ</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    最新のエンコードアルゴリズムを使用。WAVからのMP3圧縮も、アーティファクトを最小限に抑え、クリアな音色を維持します。
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">無料、かつ無制限</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    ファイルサイズ制限や回数制限なし。ブラウザリソースを最大限に活用し、ローカル環境のパワーで快適に変換処理が行えます。
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
