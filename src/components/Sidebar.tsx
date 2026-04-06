"use client";

import React from "react";
import { Image as ImageIcon, Video, Music, Settings, Info, ExternalLink } from "lucide-react";

type Mode = "image" | "video" | "audio";

interface SidebarProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentMode, onModeChange }) => {
  const menuItems = [
    { id: "image", icon: ImageIcon, label: "画像変換", color: "text-accent-image", bg: "bg-emerald-500/10" },
    { id: "video", icon: Video, label: "動画・動画圧縮", color: "text-accent-video", bg: "bg-sky-500/10" },
    { id: "audio", icon: Music, label: "音声変換", color: "text-accent-audio", bg: "bg-indigo-500/10" },
  ] as const;

  return (
    <aside className="w-64 h-screen bg-panel border-r border-border flex flex-col shrink-0">
      {/* Header */}
      <div className="p-6 border-b border-border bg-white/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center">
            <Settings className="text-white w-5 h-5" />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-slate-900">Media Converter</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 flex flex-col gap-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onModeChange(item.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
              currentMode === item.id
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors ${
              currentMode === item.id ? item.bg : "bg-transparent group-hover:bg-slate-200/50"
            }`}>
              <item.icon
                className={`w-4 h-4 transition-colors ${
                  currentMode === item.id ? item.color : "group-hover:text-slate-700"
                }`}
              />
            </div>
            <span className="font-semibold text-sm">{item.label}</span>
            {currentMode === item.id && (
              <div className={`absolute left-0 w-1 h-6 rounded-r-full ${item.color.replace('text-', 'bg-')}`} />
            )}
          </button>
        ))}
      </nav>

      {/* Footer / Ad Placeholder */}
      <div className="p-4 border-t border-border mt-auto bg-white/30">
        <div className="bg-white border border-border rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Sponsored</span>
            <ExternalLink className="w-3 h-3 text-slate-300" />
          </div>
          <div className="w-full aspect-[16/9] bg-slate-50 rounded-xl flex items-center justify-center border border-dashed border-slate-200">
            <span className="text-[9px] text-slate-400 text-center px-4 font-mono leading-relaxed">
              Amazon Associate<br />160 x 600 Slot
            </span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-4">
          <button title="Info" className="p-2 text-slate-300 hover:text-slate-500 transition-colors">
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
