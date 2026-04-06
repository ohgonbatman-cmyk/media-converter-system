"use client";

import React, { useState } from "react";
import { ConverterLayout } from "@/components/ConverterLayout";
import { FileUploader } from "@/components/FileUploader";
import { ImageConverter } from "@/components/ImageConverter";
import { ShieldCheck, Camera, Info } from "lucide-react";

export default function ImageClient() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleReset = () => {
    setSelectedFiles([]);
  };

  return (
    <ConverterLayout 
      category="Image Converter"
      title="画像コンバーター (HEIC/WebP対応)"
      description="PNG, JPG, WebP への変換と一括リサイズ。iPhoneのHEIC形式もブラウザで即座に変換可能。"
      color="bg-emerald-500"
    >
      <div className="flex flex-col gap-12 h-full">
        {selectedFiles.length > 0 ? (
          <ImageConverter files={selectedFiles} onReset={handleReset} />
        ) : (
          <>
            <FileUploader 
              onFileSelect={handleFileSelect} 
              accept=".png,.jpg,.jpeg,.webp,.heic,.heif" 
              color="bg-emerald-500" 
              label="画像変換を開始" 
            />

            {/* SEO & Feature Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-center border-b-4 border-b-slate-100">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-inner">
                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 mb-3 text-xl tracking-tight">
                      サーバーへのアップロードなし
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      写真は個人情報です。当ツールでは、ファイルはサーバーには送信されず、あなたのブラウザ内だけで変換が完結します。機密性の高い写真やプライベートな画像も安心して処理可能です。
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-center border-b-4 border-b-slate-100">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl shadow-inner">
                    <Camera className="w-8 h-8 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 mb-3 text-xl tracking-tight">
                      Exif情報（位置情報）の自動削除
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      SNSに投稿する前に位置情報を消したい場合も安心。変換プロセスでメタデータを制御し、プライバシーを守ります。「画像 位置情報 削除」を素早く安全に実現。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional SEO Content */}
            <article className="prose prose-slate max-w-none bg-white/50 border border-slate-100 p-12 rounded-[2.5rem]">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <Info className="w-6 h-6 text-slate-400" /> 
                HEIC JPG 変換・WebP 変換を最速で
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">iPhoneユーザーに最適</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    最新のiPhoneで保存されるHEIC形式。PCや古いデバイスでは読み取れないことがよくあります。当ツールなら、大量のHEICファイルを一括でJPGやPNGに変換できます。
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">プロのWeb制作にも</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Webサイトの表示速度改善に欠かせない WebP への変換もサポート。一括リサイズ機能と組み合わせることで、ブロガーやWebディレクターの作業効率を劇的に向上させます。
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
