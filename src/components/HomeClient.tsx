"use client";

import React from "react";
import Link from "next/link";
import { ConverterLayout } from "@/components/ConverterLayout";
import { 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileText, 
  ShieldCheck, 
  Zap, 
  Lock,
  ArrowRight,
  Cpu
} from "lucide-react";
import { HomeStats } from "@/components/HomeStats";
import { FAQSection } from "@/components/FAQSection";

interface HomeClientProps {
  lang: string;
  dict: any;
}

export default function HomeClient({ lang, dict }: HomeClientProps) {
  const tools = [
    {
      title: dict.home.tools.image.title,
      description: dict.home.tools.image.description,
      href: `/${lang}/image`,
      icon: ImageIcon,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      border: "border-emerald-100"
    },
    {
      title: dict.home.tools.video.title,
      description: dict.home.tools.video.description,
      href: `/${lang}/video`,
      icon: Video,
      color: "text-sky-500",
      bg: "bg-sky-50",
      border: "border-sky-100"
    },
    {
      title: dict.home.tools.audio.title,
      description: dict.home.tools.audio.description,
      href: `/${lang}/audio`,
      icon: Music,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
      border: "border-indigo-100"
    },
    {
      title: dict.home.tools.pdf.title,
      description: dict.home.tools.pdf.description,
      href: `/${lang}/pdf`,
      icon: FileText,
      color: "text-sky-600",
      bg: "bg-sky-50",
      border: "border-sky-100"
    }
  ];

  return (
    <ConverterLayout
      category="Portal"
      title={dict.home.main_title}
      description={dict.home.main_description}
      color="bg-slate-900"
      lang={lang}
      dict={dict}
    >
      <div className="flex flex-col gap-16 pb-20">
        
        {/* Hero Section */}
        <section className="relative min-h-[400px] md:min-h-[520px] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl group border border-white/20">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
            style={{ backgroundImage: "url('/hero-bg.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/40 to-transparent" />
          
          <div className="relative h-full flex flex-col justify-center p-8 md:p-20 md:pb-24 max-w-2xl">
            <div className="flex items-center gap-2 mb-6 animate-in fade-in slide-in-from-left-4 duration-700">
               <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em]">
                 {dict.home.hero_badge}
               </span>
            </div>
            <h1 className="text-2xl md:text-5xl font-black text-white leading-tight tracking-tight mb-6 md:mb-8 animate-in fade-in slide-in-from-left-6 duration-1000 max-w-lg whitespace-pre-line">
              {dict.home.hero_title}
            </h1>
            <p className="text-sm md:text-lg text-slate-200/80 font-medium leading-relaxed mb-8 md:mb-10 animate-in fade-in slide-in-from-left-8 duration-1000 max-w-md">
              {dict.home.hero_description}
            </p>
            <div className="flex items-center gap-6 animate-in fade-in slide-in-from-left-10 duration-1000">
               <Link 
                href={`/${lang}/image`} 
                onClick={() => {
                  import("@/lib/tracking").then(m => m.trackEvent("click_hero_cta"));
                }}
                className="bg-sky-500 hover:bg-sky-400 text-white font-black px-8 md:px-10 py-3 md:py-4 rounded-2xl shadow-xl hover:shadow-sky-500/20 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-xs md:text-sm"
               >
                 {dict.home.hero_button}
                 <ArrowRight className="w-4 h-4" />
               </Link>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
          {tools.map((tool, idx) => (
            <Link 
              key={tool.title} 
              href={tool.href}
              className="group bg-white border border-slate-100 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-500 flex flex-col items-start gap-4 md:gap-6 relative overflow-hidden"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div className={`p-4 ${tool.bg} rounded-2xl group-hover:scale-110 transition-transform duration-500`}>
                <tool.icon className={`w-8 h-8 ${tool.color}`} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-sky-600 transition-colors uppercase tracking-tight">
                  {tool.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {tool.description}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-slate-300 group-hover:text-sky-500 uppercase tracking-widest transition-colors self-end uppercase">
                {dict.common.launch_tool} <ArrowRight className="w-3 h-3" />
              </div>
              
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[4rem] flex items-center justify-center -mr-12 -mt-12 group-hover:mr-0 group-hover:mt-0 transition-all duration-700 opacity-20">
                 <Zap className={`w-6 h-6 ${tool.color}`} />
              </div>
            </Link>
          ))}
        </section>

        {/* Security Section */}
        <section className="bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-8 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.2)_0,transparent_100%)] animate-pulse" />
          </div>
          
          <div className="relative max-w-3xl mx-auto">
            <div className="flex justify-center mb-8">
               <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center border border-white/20">
                  <ShieldCheck className="w-8 h-8 text-sky-400" />
               </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-4 md:mb-6 uppercase tracking-wider">
              {dict.home.security_title}
            </h2>
            <p className="text-slate-400 text-sm md:text-lg leading-relaxed font-medium mb-8 md:mb-12">
              {dict.home.security_description}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
               <div className="flex flex-col items-center gap-4">
                  <Lock className="w-6 h-6 text-emerald-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{dict.home.security_no_upload}</span>
               </div>
               <div className="flex flex-col items-center gap-4">
                  <Cpu className="w-6 h-6 text-sky-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{dict.home.security_local}</span>
               </div>
               <div className="flex flex-col items-center gap-4">
                  <Zap className="w-6 h-6 text-amber-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{dict.home.security_speed}</span>
               </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <HomeStats lang={lang} dict={dict} />

        {/* Global FAQ Section */}
        {dict.home.faq && (
          <div className="pt-8">
            <FAQSection items={dict.home.faq} />
          </div>
        )}
      </div>
    </ConverterLayout>
  );
}
