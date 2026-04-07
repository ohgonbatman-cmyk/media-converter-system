"use client";

import React, { useEffect, useState } from "react";

interface HomeStatsProps {
  lang: string;
  dict: any;
}

export const HomeStats: React.FC<HomeStatsProps> = ({ dict }) => {
  const [stats, setStats] = useState({ 
    today: { files: 0, size: 0 }, 
    total: { files: 0, size: 0 } 
  });
  
  useEffect(() => {
    // APIから統計情報を取得
    fetch('/api/stats')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        if (data && data.today && data.total) {
          setStats(data);
        }
      })
      .catch(err => {
        console.error('Stats fetch error:', err);
      });
  }, []);

  const { stats_section } = dict.home;

  const formatSize = (mb: number = 0) => {
    if (mb >= 1024 * 1024) {
      return `${(mb / (1024 * 1024)).toFixed(2)}TB`;
    }
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)}GB`;
    }
    return `${mb.toFixed(2)}MB`;
  };

  return (
    <div className="mt-8 py-8 border-t border-slate-100 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 select-none">
      {/* Simple Stats Row */}
      <div className="flex flex-col items-center text-center px-4">
        <div className="text-slate-500 font-serif italic text-sm md:text-base tracking-wide flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
          <span className="font-sans not-italic font-bold text-slate-900 border-r border-slate-200 pr-4 mr-1 uppercase text-xs tracking-widest">
            {stats_section.label}
          </span>
          
          <div className="flex items-center gap-2">
            <span className="opacity-60">{stats_section.today}:</span>
            <span className="font-sans not-italic font-black text-slate-800">
              {(stats.today?.files || 0).toLocaleString()} {stats_section.files},
            </span>
            <span className="font-sans not-italic font-black text-slate-800">
              {formatSize(stats.today?.size)}
            </span>
          </div>

          <span className="opacity-20 w-px h-4 bg-slate-400 hidden md:block" />

          <div className="flex items-center gap-2">
            <span className="opacity-60">{stats_section.total}:</span>
            <span className="font-sans not-italic font-black text-sky-600">
              {(stats.total?.files || 0).toLocaleString()} {stats_section.files},
            </span>
            <span className="font-sans not-italic font-black text-sky-600">
              {formatSize(stats.total?.size)}
            </span>
          </div>
        </div>
      </div>

      {/* Copyright Footer */}
      <div className="flex flex-col items-center gap-2 opacity-60">
        <div className="text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-tight">
          © 2018-2026 <span className="text-slate-500 font-bold">Media Converter</span> | All rights reserved
        </div>
      </div>
    </div>
  );
};
