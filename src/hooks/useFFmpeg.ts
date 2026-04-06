"use client";

import { useState, useRef, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

export const useFFmpeg = () => {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const load = useCallback(async () => {
    if (ffmpegRef.current) return ffmpegRef.current;

    const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd";
    const ffmpeg = new FFmpeg();
    
    ffmpeg.on("log", ({ message }) => {
      console.log("[FFmpeg Log]", message);
    });

    ffmpeg.on("progress", ({ progress: p }) => {
      setProgress(Math.round(p * 100));
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    ffmpegRef.current = ffmpeg;
    setLoaded(true);
    return ffmpeg;
  }, []);

  const resetProgress = useCallback(() => setProgress(0), []);

  return {
    load,
    loaded,
    progress,
    resetProgress,
    ffmpeg: ffmpegRef.current,
  };
};
