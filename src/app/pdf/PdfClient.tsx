"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ConverterLayout } from "@/components/ConverterLayout";
import { FileUploader } from "@/components/FileUploader";
import { Layout, ShieldCheck, Briefcase } from "lucide-react";

const PdfConverter = dynamic(() => import("@/components/PdfConverter").then(mod => mod.PdfConverter), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
      <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-500 font-bold tracking-tight">PDFエンジンを読み込んでいます...</p>
    </div>
  )
});

export default function PdfClient() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleReset = () => {
    setSelectedFiles([]);
  };

  return (
    <ConverterLayout 
      category="Business Tool"
      title="PDFコンバーター (高精度Word変換)"
      description="PDFからWord (.docx) への変換、テキスト・画像抽出。ビジネス文書のレイアウトを維持したまま、編集可能な形式へ。"
      color="bg-sky-600"
    >
      <div className="flex flex-col gap-12 h-full">
        {selectedFiles.length > 0 ? (
          <PdfConverter files={selectedFiles} onReset={handleReset} />
        ) : (
          <>
            <FileUploader 
              onFileSelect={handleFileSelect} 
              accept=".pdf" 
              color="bg-sky-600" 
              label="PDF変換を開始" 
            />

            {/* SEO & Feature Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-center border-b-4 border-b-slate-100">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl shadow-inner">
                    <Layout className="w-8 h-8 text-sky-600" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 mb-3 text-xl tracking-tight">
                      レイアウトが崩れない構造維持
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      「PDF Word 変換」で最も多い不満はレイアウトの崩れ。当ツールでは、独自の解析エンジンにより文書の構造を極力維持。フォントや配置の正確さを徹底追求しています。
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-center border-b-4 border-b-slate-100">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-inner">
                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 mb-3 text-xl tracking-tight">
                      ビジネス用機密書類も安心
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      契約書や企画書など、外部サーバーにアップロードしたくない書類も、ブラウザ内で完結。情報漏洩リスクを物理的に遮断した、最高レベルのセキュリティ環境で処理できます。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <article className="prose prose-slate max-w-none bg-white/50 border border-slate-100 p-12 rounded-[2.5rem]">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <Briefcase className="w-6 h-6 text-slate-400" /> 
                あらゆるビジネス・学習シーンで
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Wordへの高精度変換</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    PDFを編集可能なWord形式へ変換。再入力の手間を省き、既存のドキュメントを即座に再利用できます。事務職や学生の生産性を最大化します。
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">画像・テキスト抽出</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    PDF内の画像だけを取り出したい、あるいはテキストだけを抜き出したい、といったニーズにも対応。資料作成の素材集めを強力にバックアップ。
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
