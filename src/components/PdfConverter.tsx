"use client";

import React, { useState, useEffect } from "react";
import { Download, X, FileText, CheckCircle, Loader2, PlayCircle, FileArchive, Play, FileDigit } from "lucide-react";
import { reportConversionScale } from "@/lib/stats";
import { trackEvent } from "@/lib/tracking";

// pdfjs-dist and docx are loaded dynamically inside the conversion function
// to avoid Edge Runtime / SSR errors (document is not defined).
// Do NOT add static imports for these libraries.

interface MediaFile {
  file: File;
  id: string;
  status: "pending" | "processing" | "completed" | "error";
  resultUrl?: string;
  progress: number;
  resultSize?: number;
}

interface PdfConverterProps {
  files: File[];
  onReset: () => void;
  lang: string;
  dict: any;
}

export const PdfConverter: React.FC<PdfConverterProps> = ({ files, onReset, lang, dict }) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    const newFiles = files.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: "pending" as const,
      progress: 0,
    }));
    setMediaFiles(newFiles);
  }, [files]);

  const convertPdfToDocx = async (mediaFile: MediaFile) => {
    setIsProcessing(true);
    setMediaFiles(prev => prev.map(f => f.id === mediaFile.id ? { ...f, status: "processing" } : f));

    try {
      // Dynamic imports: these libraries reference `document` at module level
      // and MUST NOT be statically imported to avoid Edge Runtime crashes.
      const pdfjsLib = await import("pdfjs-dist");
      const docxModule = await import("docx");
      const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType } = docxModule;

      // Use fixed worker version matching our package for reliability
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

      const arrayBuffer = await mediaFile.file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const docChildren: any[] = [];
      const numPages = pdf.numPages;

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // --- 1. Text Extraction & Basic Paragraph Construction ---
        // Group text items by their vertical position (y coordinate)
        const items = textContent.items as any[];
        const lines: { y: number, text: string }[] = [];
        
        items.sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);

        let currentY = -1;
        let currentLine = "";

        for (const item of items) {
          const y = Math.round(item.transform[5]);
          if (currentY !== y && currentLine !== "") {
            lines.push({ y: currentY, text: currentLine.trim() });
            currentLine = "";
          }
          currentY = y;
          currentLine += item.str + " ";
        }
        if (currentLine !== "") lines.push({ y: currentY, text: currentLine.trim() });

        // Add page header/marker as a heading
        docChildren.push(new Paragraph({
          text: dict.pdf.page_label.replace("{page}", i.toString()),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }));

        // Process lines into paragraphs
        lines.forEach(line => {
          if (line.text.length > 0) {
            docChildren.push(new Paragraph({
              children: [new TextRun(line.text)],
              spacing: { after: 120 }
            }));
          }
        });

        // --- 2. Image Extraction ---
        try {
          const operatorList = await page.getOperatorList();
          const { OPS } = pdfjsLib as any;

          for (let j = 0; j < operatorList.fnArray.length; j++) {
            const fn = operatorList.fnArray[j];
            if (fn === OPS.paintJpegXObject || fn === OPS.paintImageXObject) {
              const imgName = operatorList.argsArray[j][0];
              let img: any;
              try {
                img = await page.objs.get(imgName);
              } catch (e) {
                img = await page.commonObjs.get(imgName);
              }

              if (img && img.data && typeof document !== "undefined") {
                // Convert raw image data to a usable format for docx
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  const imageData = ctx.createImageData(img.width, img.height);
                  // pdf.js raw data handling (RGBA/RGB)
                  if (img.data.length === img.width * img.height * 4) {
                    imageData.data.set(img.data);
                  } else {
                    // RGB to RGBA conversion if necessary
                    for (let k = 0, l = 0; k < img.data.length; k += 3, l += 4) {
                        imageData.data[l] = img.data[k];
                        imageData.data[l+1] = img.data[k+1];
                        imageData.data[l+2] = img.data[k+2];
                        imageData.data[l+3] = 255;
                    }
                  }
                  ctx.putImageData(imageData, 0, 0);
                  
                  const imageBase64 = canvas.toDataURL("image/png").split(",")[1];
                  const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));

                  docChildren.push(new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        data: imageBuffer,
                        transformation: {
                          width: Math.min(img.width, 500), 
                          height: (Math.min(img.width, 500) / img.width) * img.height,
                        },
                        type: "png"
                      } as any),
                    ],
                    spacing: { before: 200, after: 200 },
                  }));
                }
              }
            }
          }
        } catch (e) {
          console.warn("Failed to extract images from page", i, e);
        }

        setOverallProgress(Math.round((i / numPages) * 100));
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: docChildren,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const size = blob.size;

      setMediaFiles(prev => prev.map(f => f.id === mediaFile.id ? { ...f, status: "completed", resultUrl: url, progress: 100, resultSize: size } : f));
      
      // 個別報告
      if (!isProcessingAll) {
        reportConversionScale(1, size);
      }
    } catch (error) {
      console.error(error);
      setMediaFiles(prev => prev.map(f => f.id === mediaFile.id ? { ...f, status: "error" } : f));
    } finally {
      setIsProcessing(false);
      setOverallProgress(0);
    }
  };

  const handleProcessAll = async () => {
    const pendingFiles = mediaFiles.filter(f => f.status === "pending");
    if (pendingFiles.length === 0) return;

    trackEvent("start_conversion", {
      media_type: "pdf",
      count: pendingFiles.length
    });

    setIsProcessingAll(true);
    for (const mFile of pendingFiles) {
      await convertPdfToDocx(mFile);
    }

    // まとめて統計報告
    const results = await new Promise<MediaFile[]>(resolve => {
      setMediaFiles(prev => {
        resolve(prev);
        return prev;
      });
    });
    const newlyDone = results.filter(f => pendingFiles.some(p => p.id === f.id) && f.status === "completed" && f.resultSize);
    if (newlyDone.length > 0) {
      const totalSize = newlyDone.reduce((acc, curr) => acc + (curr.resultSize || 0), 0);
      reportConversionScale(newlyDone.length, totalSize);
    }
    setIsProcessingAll(false);
  };

  const handleDownload = (mFile: MediaFile) => {
    if (!mFile.resultUrl || typeof document === "undefined") return;
    const a = document.createElement("a");
    const originalName = mFile.file.name.substring(0, mFile.file.name.lastIndexOf("."));
    a.href = mFile.resultUrl;
    a.download = `${originalName}.docx`;
    a.click();
  };

  const anyCompleted = mediaFiles.some(f => f.status === "completed");
  const allCompleted = mediaFiles.length > 0 && mediaFiles.every(f => f.status === "completed");

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Options Bar */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2.5rem] md:rounded-[2.5rem] flex flex-col gap-8 shadow-sm ring-1 ring-slate-100 font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col gap-2 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{dict.pdf.format_label}</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 overflow-hidden h-[46px]">
              <FileText className="w-4 h-4 text-sky-500" />
              {dict.pdf.format_desc}
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-400 mr-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">{dict.common.local_process}</span>
          </div>

          <button 
            onClick={() => {
              trackEvent("cancel_operation", { media_type: "pdf" });
              onReset();
            }} 
            className="text-slate-400 hover:text-slate-600 text-xs sm:text-sm font-bold px-6 py-2 transition-colors uppercase tracking-tight"
          >
            {dict.common.cancel}
          </button>
          
          {!allCompleted && (
            <button 
                onClick={handleProcessAll}
                disabled={isProcessing || mediaFiles.length === 0}
                className="bg-accent-video hover:bg-sky-700 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-xs sm:text-sm flex-1 sm:flex-none min-w-[200px]"
            >
                {isProcessing ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
                {dict.pdf.process_all}
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {isProcessing && (
        <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-[2rem] md:rounded-3xl flex flex-col gap-5 shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold flex items-center gap-3 text-slate-800 text-sm md:text-base">
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-sky-500" />
              {dict.pdf.processing_label}
            </h4>
            <span className="text-xs md:text-sm font-black font-mono text-sky-500">{overallProgress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
            <div 
              className="h-full bg-sky-500 transition-all duration-300 shadow-[0_0_8px_rgba(14,165,233,0.3)]" 
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-1 scale-90">
            {dict.pdf.processing_desc}
          </p>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-3 scrollbar-thin">
        {mediaFiles.map((mFile) => (
          <div 
            key={mFile.id}
            className="bg-white border border-slate-100 p-4 md:p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 md:gap-5 group hover:shadow-md hover:border-slate-200 transition-all shadow-sm"
          >
            <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0 shadow-inner">
              <FileDigit className="w-5 h-5 md:w-6 md:h-6 text-sky-400" />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left w-full">
              <h4 className="font-black text-slate-800 truncate text-xs md:text-sm">{mFile.file.name}</h4>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 md:gap-3 mt-1.5 text-[9px] md:text-[10px] text-slate-400 font-bold font-mono">
                <span className="px-1.5 py-0.5 bg-slate-100 rounded">{(mFile.file.size / 1024 / 1024).toFixed(2)} MB</span>
                <span className="uppercase text-slate-300 px-1.5 py-0.5 border border-slate-50 rounded text-[8px] md:text-[9px]">PDF DOCUMENT</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {mFile.status === "completed" && (
                <div className="flex items-center gap-1.5 text-sky-600 bg-sky-50 px-4 py-2 rounded-xl border border-sky-100 shadow-sm animate-in zoom-in-95">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">{dict.pdf.success}</span>
                </div>
              )}
              {mFile.status === "processing" && <Loader2 className="w-4 h-4 animate-spin text-sky-500" />}
              
              {mFile.status === "completed" ? (
                <button 
                  onClick={() => {
                    trackEvent("download_result", { media_type: "pdf", is_zip: false, count: 1 });
                    handleDownload(mFile);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl border border-slate-800 transition-all shadow-md group/dl active:scale-95"
                >
                  <Download className="w-5 h-5 group-hover/dl:scale-110 transition-transform" />
                </button>
              ) : (
                <button 
                  onClick={() => {
                    trackEvent("start_conversion", { media_type: "pdf", count: 1 });
                    convertPdfToDocx(mFile);
                  }}
                  disabled={isProcessing}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl border border-slate-200 transition-all disabled:opacity-30 active:scale-95"
                  title="Convert"
                >
                  <PlayCircle className="w-5 h-5" />
                </button>
              )}
              
              <button 
                onClick={() => setMediaFiles(prev => prev.filter(f => f.id !== mFile.id))}
                className="text-slate-300 hover:text-red-500 p-2 transition-colors disabled:opacity-0"
                disabled={isProcessing}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
