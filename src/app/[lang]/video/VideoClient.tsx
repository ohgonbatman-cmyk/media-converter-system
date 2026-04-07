"use client";

import React, { useState } from "react";
import { ConverterLayout } from "@/components/ConverterLayout";
import { FileUploader } from "@/components/FileUploader";
import { VideoConverter } from "@/components/VideoConverter";
import { Zap, Music, Smartphone, Info } from "lucide-react";

interface VideoClientProps {
  lang: string;
  dict: any;
}

export default function VideoClient({ lang, dict }: VideoClientProps) {
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
      title={dict.video_page.title}
      description={dict.video_page.description}
      color="bg-sky-500"
      lang={lang}
      dict={dict}
    >
      <div className="flex flex-col gap-12 h-full">
        {selectedFiles.length > 0 ? (
          <VideoConverter files={selectedFiles} onReset={handleReset} lang={lang} dict={dict} />
        ) : (
          <>
            <FileUploader 
              onFileSelect={handleFileSelect} 
              accept=".mp4,.webm,.mov,.avi" 
              color="bg-sky-500" 
              label={dict.common.launch_tool} 
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
                      {dict.video_page.preset_title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      {dict.video_page.preset_desc}
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
                      {dict.video_page.audio_title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      {dict.video_page.audio_desc}
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
                  {dict.video_page.zap_title}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed max-w-2xl font-medium mb-8">
                  {dict.video_page.zap_desc}
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
                {dict.video_page.info_title}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">{dict.video_page.mov_title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {dict.video_page.mov_desc}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">{dict.video_page.privacy_title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {dict.video_page.privacy_desc}
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
