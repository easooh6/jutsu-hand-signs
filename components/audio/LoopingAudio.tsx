"use client";

import { useEffect } from "react";

export function LoopingAudio({
  src,
  volume = 1,
}: {
  src: string;
  volume?: number;
}) {
  useEffect(() => {
    const audio = new Audio(src);
    let disposed = false;

    audio.loop = true;
    audio.preload = "auto";
    audio.volume = volume;

    function removeUnlockListeners() {
      document.removeEventListener("pointerdown", startPlayback);
      document.removeEventListener("keydown", startPlayback);
    }

    function startPlayback() {
      if (disposed || !audio.paused) return;

      void audio.play().then(removeUnlockListeners).catch(() => {
        // A later player interaction will retry browser-blocked autoplay.
      });
    }

    document.addEventListener("pointerdown", startPlayback);
    document.addEventListener("keydown", startPlayback);
    startPlayback();

    return () => {
      disposed = true;
      removeUnlockListeners();
      audio.pause();
      audio.currentTime = 0;
    };
  }, [src, volume]);

  return null;
}
