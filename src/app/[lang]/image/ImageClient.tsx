"use client";

import React, { useState } from "react";
import { ConverterLayout } from "@/components/ConverterLayout";
import { FileUploader } from "@/components/FileUploader";
import { ImageConverter } from "@/components/ImageConverter";
import { FAQSection } from "@/components/FAQSection";
import { ShieldCheck, Camera, Info } from "lucide-react";

interface ImageClientProps {
  lang: string;
  dict: any;
  mode?: "converter" | "compressor";
}

export default function ImageClient({ lang, dict, mode = "converter" }: ImageClientProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleReset = () => {
    setSelectedFiles([]);
  };

  return (
    <ConverterLayout 
      category={mode === "compressor" ? "Image Compressor" : "Image Converter"}
      title={mode === "compressor" ? dict.metadata.compress_image.title : dict.image_page.title}
      description={mode === "compressor" ? dict.metadata.compress_image.description : dict.image_page.description}
      color="bg-emerald-500"
      lang={lang}
      dict={dict}
    >
      <div className="flex flex-col gap-12 h-full">
        {selectedFiles.length > 0 ? (
          <ImageConverter files={selectedFiles} onReset={handleReset} lang={lang} dict={dict} mode={mode} />
        ) : (
          <>
            <FileUploader 
              onFileSelect={handleFileSelect} 
              accept=".png,.jpg,.jpeg,.webp,.heic,.heif" 
              color="bg-emerald-500" 
              label={dict.image.process_all} 
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
                      {dict.image_page.secure_title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      {dict.image_page.secure_desc}
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
                      {dict.image_page.exif_title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      {dict.image_page.exif_desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional SEO Content */}
            <article className="prose prose-slate max-w-none bg-white/50 border border-slate-100 p-12 rounded-[2.5rem]">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <Info className="w-6 h-6 text-slate-400" /> 
                {dict.image_page.info_title}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">{dict.image_page.iphone_title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {dict.image_page.iphone_desc}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">{dict.image_page.pro_title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {dict.image_page.pro_desc}
                  </p>
                </div>
              </div>
            </article>

            {/* FAQ Section */}
            {dict.image_page.faq && (
              <FAQSection items={dict.image_page.faq} />
            )}
          </>
        )}
      </div>
    </ConverterLayout>
  );
}
