"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Image as ImageIcon, Video, Music, FileText, Settings, Info, ExternalLink, LayoutGrid } from "lucide-react";

interface SidebarProps {
  lang: string;
  dict: {
    sidebar: {
      home: string;
      convert_group?: string;
      compress_group?: string;
      image: string;
      video: string;
      audio: string;
      pdf: string;
      compress_image?: string;
      compress_video?: string;
      compress_audio?: string;
      compress_pdf?: string;
      sponsored: string;
    };
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ lang, dict }) => {
  const pathname = usePathname();
  
  const menuGroups = [
    {
      title: dict.sidebar.convert_group || "CONVERT",
      items: [
        { id: "image", href: `/${lang}/image`, icon: ImageIcon, label: dict.sidebar.image, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { id: "video", href: `/${lang}/video`, icon: Video, label: dict.sidebar.video, color: "text-sky-500", bg: "bg-sky-500/10" },
        { id: "audio", href: `/${lang}/audio`, icon: Music, label: dict.sidebar.audio, color: "text-indigo-500", bg: "bg-indigo-500/10" },
        { id: "pdf", href: `/${lang}/pdf`, icon: FileText, label: dict.sidebar.pdf, color: "text-red-500", bg: "bg-red-500/10" },
      ]
    },
    {
      title: dict.sidebar.compress_group || "COMPRESS",
      items: [
        { id: "compress_image", href: `/${lang}/compress-image`, icon: ImageIcon, label: dict.sidebar.compress_image || "Compress Image", color: "text-emerald-600", bg: "bg-emerald-600/10" },
        { id: "compress_video", href: `/${lang}/compress-video`, icon: Video, label: dict.sidebar.compress_video || "Compress Video", color: "text-sky-600", bg: "bg-sky-600/10" },
        { id: "compress_audio", href: `/${lang}/compress-audio`, icon: Music, label: dict.sidebar.compress_audio || "Compress Audio", color: "text-indigo-600", bg: "bg-indigo-600/10" },
        { id: "compress_pdf", href: `/${lang}/compress-pdf`, icon: FileText, label: dict.sidebar.compress_pdf || "Compress PDF", color: "text-red-600", bg: "bg-red-600/10" },
      ]
    }
  ];

  return (
    <aside className="w-64 h-screen bg-[#FDFDFD] border-r border-slate-100 hidden lg:flex flex-col shrink-0">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 bg-white/50">
        <Link href={`/${lang}`} className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
            <Settings className="text-white w-4 h-4" />
          </div>
          <h1 className="font-bold text-base tracking-tight text-slate-900">Media Converter</h1>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto scrollbar-none">
        <div>
           <Link
              href={`/${lang}`}
              onClick={() => {
                import("@/lib/tracking").then(m => m.trackEvent("navigate_tool", { destination_tool: "home" }));
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative ${
                pathname === `/${lang}`
                  ? "bg-white text-slate-900 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] ring-1 ring-slate-100"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors duration-300 ${
                pathname === `/${lang}` ? "bg-slate-900/10" : "bg-transparent group-hover:bg-slate-100"
              }`}>
                <LayoutGrid className={`w-4 h-4 transition-colors ${
                    pathname === `/${lang}` ? "text-slate-900" : "group-hover:text-slate-500"
                  }`}
                />
              </div>
              <span className={`text-[13px] font-bold tracking-tight transition-colors ${
                pathname === `/${lang}` ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"
              }`}>
                {dict.sidebar.home}
              </span>
            </Link>
        </div>

        {menuGroups.map((group) => (
          <div key={group.title} className="flex flex-col gap-1">
            <h3 className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">{group.title}</h3>
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    import("@/lib/tracking").then(m => m.trackEvent("navigate_tool", { destination_tool: item.id }));
                  }}
                  className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all duration-300 group relative ${
                    isActive
                      ? "bg-white text-slate-900 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] ring-1 ring-slate-100"
                      : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg transition-colors duration-300 ${
                    isActive ? item.bg : "bg-transparent group-hover:bg-slate-100"
                  }`}>
                    <item.icon
                      className={`w-3.5 h-3.5 transition-colors ${
                        isActive ? item.color : "group-hover:text-slate-500"
                      }`}
                    />
                  </div>
                  <span className={`text-[12px] font-bold tracking-tight transition-colors ${
                    isActive ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"
                  }`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer / Ad Placeholder */}
      <div className="p-4 border-t border-slate-50 mt-auto bg-white/30">
        <div className="bg-white border border-slate-100 rounded-[2rem] p-5 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between px-1">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] leading-none">{dict.sidebar.sponsored}</span>
            <ExternalLink className="w-3 h-3 text-slate-200" />
          </div>
          <div className="w-full h-32 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-dashed border-slate-200 group hover:bg-slate-100/50 transition-colors cursor-pointer">
            <span className="text-[9px] text-slate-400 text-center px-4 font-mono leading-relaxed opacity-60 uppercase font-bold tracking-widest">
              Amazon Associate<br />160 x 600 Slot
            </span>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-center gap-4">
          <button title="Info" className="p-2 text-slate-200 hover:text-slate-400 transition-colors">
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
