"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoveHorizontal, MoveVertical } from "lucide-react";

interface TikTokPreviewProps {
  file: File;
  onOffsetChange: (offset: number) => void;
  mode: "crop" | "letterbox" | "blur";
  dict: any;
}

export const TikTokPreview: React.FC<TikTokPreviewProps> = ({ file, onOffsetChange, mode, dict }) => {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);
  const [offset, setOffset] = useState<number>(50); // 0 to 100
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    const video = document.createElement("video");
    video.src = url;
    video.onloadedmetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        setAspectRatio(video.videoWidth / video.videoHeight);
      }
    };

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current || !containerRef.current || mode !== "crop") return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    if (aspectRatio > 9 / 16) {
      // Horizontal drag
      const newOffset = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(0, Math.min(100, newOffset));
      setOffset(clamped);
      onOffsetChange(clamped);
    } else {
      // Vertical drag
      const newOffset = ((clientY - rect.top) / rect.height) * 100;
      const clamped = Math.max(0, Math.min(100, newOffset));
      setOffset(clamped);
      onOffsetChange(clamped);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, []);

  // Calculate guide box position
  const isHorizontal = aspectRatio > 9 / 16;
  const guideWidth = isHorizontal ? (9 / 16) / aspectRatio * 100 : 100;
  const guideHeight = isHorizontal ? 100 : (aspectRatio / (9 / 16)) * 100;

  const guideStyle: React.CSSProperties = {
    width: `${guideWidth}%`,
    height: `${guideHeight}%`,
    left: isHorizontal ? `${Math.max(0, Math.min(100 - guideWidth, offset - guideWidth / 2))}%` : "0",
    top: isHorizontal ? "0" : `${Math.max(0, Math.min(100 - guideHeight, offset - guideHeight / 2))}%`,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {dict.video.tiktok_adjust_hint}
        </span>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">LIVE PREVIEW</span>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 group cursor-crosshair touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
      >
        {videoUrl && (
          <video 
            src={videoUrl} 
            className="w-full h-full object-contain pointer-events-none"
            muted 
            loop 
            autoPlay 
            playsInline
          />
        )}

        {/* Dynamic Overlay Modes */}
        {mode === "crop" && (
          <div 
            className="absolute border-4 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none transition-all duration-75 ease-out rounded-lg"
            style={guideStyle}
          >
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border-[0.5px] border-white/20" />
              ))}
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/40">
              {isHorizontal ? <MoveHorizontal className="w-4 h-4 text-white" /> : <MoveVertical className="w-4 h-4 text-white" />}
            </div>
          </div>
        )}

        {mode === "letterbox" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div 
               className="h-full border-x-2 border-dashed border-white/30 bg-white/5" 
               style={{ width: `${guideWidth}%` }}
             />
          </div>
        )}

        {mode === "blur" && (
          <div className="absolute inset-0 flex pointer-events-none">
             <div className="flex-1 h-full backdrop-blur-md bg-slate-900/40" />
             <div 
               className="h-full border-x border-white/30 relative shadow-[0_0_100px_rgba(0,0,0,0.5)]"
               style={{ width: `${guideWidth}%` }}
             >
                {/* 中央はクリア */}
             </div>
             <div className="flex-1 h-full backdrop-blur-md bg-slate-900/40" />
          </div>
        )}
      </div>
      
      {/* Aspect Label */}
      <div className="flex justify-center -mt-2">
         <div className="px-4 py-1 bg-slate-900 text-[10px] font-black text-white rounded-full tracking-tighter">
            TARGET AREA: 1080 × 1920 (9:16)
         </div>
      </div>
    </div>
  );
};
