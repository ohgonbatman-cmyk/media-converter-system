"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQSectionProps {
  items: FAQItem[];
}

export const FAQSection: React.FC<FAQSectionProps> = ({ items }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

  if (!items || items.length === 0) return null;

  return (
    <div className="mt-12 w-full max-w-4xl mx-auto px-4 md:px-0">
      <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-tight flex items-center gap-3">
        FAQ
        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
          よくある質問
        </span>
      </h2>
      <div className="space-y-4">
        {items.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                isOpen ? "border-sky-200 bg-sky-50/30" : "border-slate-100 bg-white"
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 focus:outline-none"
              >
                <h3 className={`font-bold leading-relaxed transition-colors ${
                  isOpen ? "text-sky-700" : "text-slate-700"
                }`}>
                  {item.q}
                </h3>
                <div
                  className={`p-1 rounded-full shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-180 bg-sky-100 text-sky-600" : "bg-slate-50 text-slate-400"
                  }`}
                >
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>
              <div
                className={`transition-all duration-500 ease-in-out ${
                  isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                } overflow-hidden`}
              >
                <div className="px-6 pb-6 text-slate-600 leading-relaxed font-medium">
                  {item.a}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
