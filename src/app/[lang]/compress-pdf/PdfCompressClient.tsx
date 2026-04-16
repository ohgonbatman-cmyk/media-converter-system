"use client";

import React, { useState } from "react";
import { ConverterLayout } from "@/components/ConverterLayout";
import { FileUploader } from "@/components/FileUploader";
import { PdfCompressor } from "@/components/PdfCompressor";
import { FAQSection } from "@/components/FAQSection";
import { ShieldCheck, Info } from "lucide-react";

interface PdfCompressClientProps {
  lang: string;
  dict: any;
}

export default function PdfCompressClient({ lang, dict }: PdfCompressClientProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleReset = () => {
    setSelectedFiles([]);
  };

  return (
    <ConverterLayout 
      category="PDF Compressor"
      title={dict.pdf.compress_title}
      description={dict.metadata.compress_pdf.description}
      color="bg-red-500"
      lang={lang}
      dict={dict}
    >
      <div className="flex flex-col gap-12 h-full">
        {selectedFiles.length > 0 ? (
          <PdfCompressor files={selectedFiles} onReset={handleReset} lang={lang} dict={dict} />
        ) : (
          <>
            <FileUploader 
              onFileSelect={handleFileSelect} 
              accept=".pdf" 
              color="bg-red-500" 
              label={dict.common.launch_tool} 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm border-b-4 border-b-slate-100 flex items-start gap-6">
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl shadow-inner shrink-0">
                  <ShieldCheck className="w-8 h-8 text-red-600" />
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

               <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm border-b-4 border-b-slate-100 flex items-start gap-6">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner shrink-0">
                  <Info className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 mb-3 text-xl tracking-tight">
                    Privacy First Optimization
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Our PDF compression works entirely in your browser using local resources. Your sensitive documents never leave your computer.
                  </p>
                </div>
              </div>
            </div>

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
