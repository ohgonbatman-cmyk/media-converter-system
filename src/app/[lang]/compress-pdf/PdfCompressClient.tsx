"use client";

import React, { useState } from "react";
import { ConverterLayout } from "@/components/ConverterLayout";
import { FileUploader } from "@/components/FileUploader";
import { ShieldCheck, Info, FileDown } from "lucide-react";

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
      title={dict.metadata.compress_pdf.title}
      description={dict.metadata.compress_pdf.description}
      color="bg-red-500"
      lang={lang}
      dict={dict}
    >
      <div className="flex flex-col gap-12 h-full">
        {selectedFiles.length > 0 ? (
          <div className="bg-white p-12 rounded-[3rem] text-center border border-slate-100 shadow-xl">
             <div className="p-6 bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <FileDown className="w-10 h-10 text-red-500" />
             </div>
             <h3 className="text-2xl font-black text-slate-800 mb-4">PDF Compression Engine</h3>
             <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
                Implementing high-performance image optimization for PDF. Coming shortly to keep your documents lightweight.
             </p>
             <button 
               onClick={() => {
                 import("@/lib/tracking").then(m => m.trackEvent("cancel_operation", { media_type: "compress_pdf" }));
                 handleReset();
               }}
               className="bg-slate-900 text-white font-black px-10 py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-lg"
             >
                {dict.common.cancel}
             </button>
          </div>
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
          </>
        )}
      </div>
    </ConverterLayout>
  );
}
