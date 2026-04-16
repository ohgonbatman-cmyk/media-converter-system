"use client";

import React, { useState } from "react";
import { ConverterLayout } from "@/components/ConverterLayout";
import { FileUploader } from "@/components/FileUploader";
import { AudioConverter } from "@/components/AudioConverter";
import { FAQSection } from "@/components/FAQSection";
import { Music, Activity, Archive, Speaker, Info } from "lucide-react";

interface AudioClientProps {
  lang: string;
  dict: any;
  mode?: "converter" | "compressor";
}

export default function AudioClient({ lang, dict, mode = "converter" }: AudioClientProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleReset = () => {
    setSelectedFiles([]);
  };

  return (
    <ConverterLayout 
      category={mode === "compressor" ? "Audio Compressor" : "Audio Converter"}
      title={mode === "compressor" ? dict.metadata.compress_audio.title : dict.audio_page.title}
      description={mode === "compressor" ? dict.metadata.compress_audio.description : dict.audio_page.description}
      color="bg-indigo-500"
      lang={lang}
      dict={dict}
    >
      <div className="flex flex-col gap-12 h-full">
        {selectedFiles.length > 0 ? (
          <AudioConverter files={selectedFiles} onReset={handleReset} lang={lang} dict={dict} mode={mode} />
        ) : (
          <>
            <FileUploader 
              onFileSelect={handleFileSelect} 
              accept=".mp3,.wav,.aac,.ogg,.flac" 
              color="bg-indigo-500" 
              label={dict.common.launch_tool} 
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
                      {dict.audio_page.spec_title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      {dict.audio_page.spec_desc}
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
                      {dict.audio_page.lossless_title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      {dict.audio_page.lossless_desc}
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
                  {dict.audio_page.batch_title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xl font-medium">
                  {dict.audio_page.batch_desc}
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
                {dict.audio_page.info_title}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">{dict.audio_page.wav_title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {dict.audio_page.wav_desc}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">{dict.audio_page.limit_title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {dict.audio_page.limit_desc}
                  </p>
                </div>
              </div>
            </article>

            {/* FAQ Section */}
            {dict.audio_page.faq && (
              <FAQSection items={dict.audio_page.faq} />
            )}
          </>
        )}
      </div>
    </ConverterLayout>
  );
}
