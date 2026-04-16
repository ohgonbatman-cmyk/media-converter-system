"use client";

import React from "react";
import { 
  LucideIcon, 
  CheckCircle2, 
  Smartphone, 
  Image as ImageIcon, 
  Mic, 
  FileText,
  ShieldCheck,
  Zap,
  ArrowRight
} from "lucide-react";

interface UseCase {
  id: string;
  title: string;
  description: string;
  icon?: LucideIcon;
}

interface UseCaseSectionProps {
  title?: string;
  useCases: UseCase[];
  color?: string; // Tailwind color class like "text-sky-500"
  bg?: string;    // Tailwind bg class like "bg-sky-50"
}

export const UseCaseSection: React.FC<UseCaseSectionProps> = ({ 
  title, 
  useCases, 
  color = "text-sky-500",
  bg = "bg-sky-50" 
}) => {
  if (!useCases || useCases.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-0 mt-16 md:mt-24 mb-12">
      {title && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
          <div className="max-w-2xl">
             <div className="flex items-center gap-2 mb-3">
                <div className={`w-1 h-6 rounded-full ${bg.replace('bg-', 'bg-').replace('50', '500')}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Perfect Solutions</span>
             </div>
             <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight uppercase">
               {title}
             </h2>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {useCases.map((useCase, idx) => {
          const IconComp = useCase.icon || CheckCircle2;
          return (
            <div 
              key={useCase.id || idx}
              className="group bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-500 flex flex-col gap-6 relative overflow-hidden"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div className={`p-4 ${bg} rounded-2xl group-hover:scale-110 transition-transform duration-500 w-fit shrink-0`}>
                <IconComp className={`w-7 h-7 ${color}`} />
              </div>
              
              <div className="relative z-10">
                <h3 className="text-lg md:text-xl font-black text-slate-900 mb-3 group-hover:text-sky-600 transition-colors tracking-tight leading-tight">
                  {useCase.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {useCase.description}
                </p>
              </div>

              <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] font-black text-slate-200 group-hover:text-slate-400 uppercase tracking-widest transition-colors">
                Example Case <ArrowRight className="w-3 h-3" />
              </div>

              {/* Background Decoration */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
