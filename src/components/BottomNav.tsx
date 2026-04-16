"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Image as ImageIcon, Video, Music, FileText, LayoutGrid } from "lucide-react";

interface BottomNavProps {
  lang: string;
  dict: any;
}

export const BottomNav: React.FC<BottomNavProps> = ({ lang, dict }) => {
  const pathname = usePathname();

  const menuItems = [
    { id: "home", href: `/${lang}`, icon: LayoutGrid, label: dict.sidebar.home, color: "text-slate-900", bg: "bg-slate-900/10" },
    { id: "image", href: `/${lang}/image`, altHref: `/${lang}/compress-image`, icon: ImageIcon, label: dict.sidebar.image, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "video", href: `/${lang}/video`, altHref: `/${lang}/compress-video`, icon: Video, label: dict.sidebar.video, color: "text-sky-500", bg: "bg-sky-500/10" },
    { id: "audio", href: `/${lang}/audio`, altHref: `/${lang}/compress-audio`, icon: Music, label: dict.sidebar.audio, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { id: "pdf", href: `/${lang}/pdf`, altHref: `/${lang}/compress-pdf`, icon: FileText, label: dict.sidebar.pdf, color: "text-red-500", bg: "bg-red-500/10" },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[10000] bg-white border-t border-slate-200 lg:hidden safe-area-inset-bottom pointer-events-auto shadow-[0_-8px_30px_rgb(0,0,0,0.08)]">
      <div className="flex items-center justify-around h-16 w-full max-w-lg mx-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.altHref && pathname === item.altHref);
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all active:scale-95"
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive ? item.bg : "bg-transparent"
              }`}>
                <item.icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? item.color : "text-slate-400"
                  }`}
                />
              </div>
              <span className={`text-[9px] font-black tracking-tight leading-none ${
                isActive ? "text-slate-900" : "text-slate-400"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
