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
  dict: any;
}

const groupAndSortItems = (items: any[]) => {
  const lines: { y: number; items: any[] }[] = [];
  items.forEach((item) => {
    const y = Math.round(item.transform[5] / 5) * 5;
    const existingLine = lines.find((l) => Math.abs(l.y - y) < 5);
    if (existingLine) {
      existingLine.items.push(item);
    } else {
      lines.push({ y, items: [item] });
    }
  });
  return lines.sort((a, b) => b.y - a.y);
};

export const PdfConverter: React.FC<PdfConverterProps> = ({ files, onReset, dict }) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<"docx" | "md" | "json">("docx");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);

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
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

      const arrayBuffer = await mediaFile.file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const numPages = pdf.numPages;
      let resultBlob: Blob;

      if (targetFormat === "docx") {
        const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
        const docChildren: any[] = [];

        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const items = textContent.items as any[];
          const lines = groupAndSortItems(items);

          docChildren.push(new Paragraph({
            text: dict.pdf.page_label.replace("{page}", i.toString()),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }));

          for (const line of lines) {
            const children: any[] = [];
            for (const item of line.items) {
              const isBold = item.fontName?.toLowerCase().includes("bold");
              children.push(new TextRun({
                text: item.str + " ",
                bold: isBold,
              }));
            }
            docChildren.push(new Paragraph({ children, spacing: { after: 120 } }));
          }
        }

        const doc = new Document({ sections: [{ children: docChildren }] });
        resultBlob = await Packer.toBlob(doc);
      } else if (targetFormat === "md") {
        let mdContent = `# ${mediaFile.file.name}\n\n`;
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const items = textContent.items as any[];
          const lines = groupAndSortItems(items);

          mdContent += `## ${dict.pdf.page_label.replace("{page}", i.toString())}\n\n`;
          for (const line of lines) {
            let lineText = "";
            for (const item of line.items) {
              const isBold = item.fontName?.toLowerCase().includes("bold") || item.transform[0] > 12;
              const text = item.str.trim();
              if (text) {
                lineText += isBold ? ` **${text}** ` : ` ${text} `;
              }
            }
            if (lineText.trim()) mdContent += lineText.trim() + "\n\n";
          }
        }
        resultBlob = new Blob([mdContent], { type: "text/markdown" });
      } else {
        // JSON Format
        const jsonData: any = { filename: mediaFile.file.name, pages: [] };
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const items = textContent.items as any[];
          const lines = groupAndSortItems(items);

          jsonData.pages.push({
            pageNumber: i,
            lines: lines.map(line => ({
              text: line.items.map((it: any) => it.str).join(" "),
              items: line.items.map((it: any) => ({
                text: it.str,
                font: it.fontName,
                size: it.transform[0],
                isBold: it.fontName?.toLowerCase().includes("bold")
              }))
            }))
          });
        }
        resultBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
      }

      const url = URL.createObjectURL(resultBlob);
      const size = resultBlob.size;

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
    a.download = `${originalName}.${targetFormat === "docx" ? "docx" : targetFormat === "md" ? "md" : "json"}`;
    a.click();
  };

  const anyCompleted = mediaFiles.some(f => f.status === "completed");
  const allCompleted = mediaFiles.length > 0 && mediaFiles.every(f => f.status === "completed");

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Options Bar */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2.5rem] md:rounded-[2.5rem] flex flex-col gap-8 shadow-sm ring-1 ring-slate-100 font-sans">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-3 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              {dict.pdf.format_label}
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "docx", label: dict.pdf.format_word, icon: FileText },
                { id: "md", label: dict.pdf.format_markdown, icon: FileText },
                { id: "json", label: dict.pdf.format_json, icon: FileText },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setTargetFormat(fmt.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-tight rounded-xl border transition-all ${
                    targetFormat === fmt.id
                      ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <fmt.icon className="w-3.5 h-3.5" />
                  {fmt.label}
                </button>
              ))}
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
