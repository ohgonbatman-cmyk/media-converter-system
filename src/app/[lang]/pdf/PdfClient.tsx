"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ConverterLayout } from "@/components/ConverterLayout";
import { FileUploader } from "@/components/FileUploader";
import { FAQSection } from "@/components/FAQSection";
import { UseCaseSection } from "@/components/UseCaseSection";
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

interface PdfClientProps {
  lang: string;
  dict: any;
}

export default function PdfClient({ lang, dict }: PdfClientProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleReset = () => {
    setSelectedFiles([]);
  };

  const pdfUseCases = dict.pdf_page.use_cases?.map((uc: any) => ({
    ...uc,
    icon: uc.id === "secure" ? ShieldCheck : Layout
  })) || [];

  return (
    <ConverterLayout 
      category="Business Tool"
      title={dict.pdf_page.title}
      description={dict.pdf_page.description}
      color="bg-sky-600"
      lang={lang}
      dict={dict}
    >
      <div className="flex flex-col gap-12 h-full">
        {selectedFiles.length > 0 ? (
          <PdfConverter files={selectedFiles} onReset={handleReset} dict={dict} />
        ) : (
          <>
            <FileUploader 
              onFileSelect={handleFileSelect} 
              accept=".pdf" 
              color="bg-sky-600" 
              label={dict.common.launch_tool} 
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
                      {dict.pdf_page.layout_title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      {dict.pdf_page.layout_desc}
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
                      {dict.pdf_page.secure_title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      {dict.pdf_page.secure_desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <article className="prose prose-slate max-w-none bg-white/50 border border-slate-100 p-12 rounded-[2.5rem]">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <Briefcase className="w-6 h-6 text-slate-400" /> 
                {dict.pdf_page.info_title}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">{dict.pdf_page.word_title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {dict.pdf_page.word_desc}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">{dict.pdf_page.extract_title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {dict.pdf_page.extract_desc}
                  </p>
                </div>
              </div>
            </article>

            {/* Use Case Section */}
            <UseCaseSection 
              title={dict.pdf_page.use_cases_title}
              useCases={pdfUseCases}
              color="text-sky-700"
              bg="bg-sky-50"
            />

            {/* FAQ Section */}
            {dict.pdf_page.faq && (
              <FAQSection items={dict.pdf_page.faq} />
            )}
          </>
        )}
      </div>
    </ConverterLayout>
  );
}
