"use client";

import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { ChevronRight, ShieldCheck, Zap } from "lucide-react";

interface ConverterLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  category: string;
  color: string;
  lang: string;
  dict: any;
}

export const ConverterLayout: React.FC<ConverterLayoutProps> = ({ 
  children, 
  title, 
  description, 
  category,
  color,
  lang,
  dict
}) => {
  return (
    <div className="flex flex-col lg:flex-row flex-1 w-full h-screen overflow-hidden bg-white">
      {/* Sidebar (Desktop only) */}
      <Sidebar lang={lang} dict={dict} />

      {/* Mobile Nav (Desktop hidden) */}
      <BottomNav lang={lang} dict={dict} />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-slate-50/50 flex flex-col relative w-full">
        {/* Header */}
        <header className="p-4 sm:p-8 border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-10 w-full">
          <div className="max-w-5xl mx-auto w-full">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 leading-none">
              <span>{dict.common.title}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-900">{category}</span>
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                {category === "Portal" ? (
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{title}</h2>
                ) : (
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{title}</h1>
                )}
                <p className="text-slate-500 text-xs sm:text-sm mt-1.5 font-medium">{description}</p>
              </div>
              <div className="hidden md:flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 text-emerald-700">
                  <ShieldCheck className="w-3 h-3" /> {dict.common.secure}
                </div>
                <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 text-amber-700">
                  <Zap className="w-3 h-3" /> {dict.common.fast}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Workspace */}
        <section className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-5xl mx-auto w-full pb-24 sm:pb-20">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
};
