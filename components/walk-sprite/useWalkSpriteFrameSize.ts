"use client";

import { useEffect, useState } from "react";

export type WalkSpriteFrameSize = {
  height: number;
  width: number;
};

const COLUMNS = 3;
const ROWS = 4;
const cache = new Map<string, WalkSpriteFrameSize>();

export function useWalkSpriteFrameSize(
  src: string,
): WalkSpriteFrameSize | null {
  const [size, setSize] = useState<{
    frame: WalkSpriteFrameSize;
    src: string;
  } | null>(() => {
    const cached = cache.get(src);
    return cached ? { frame: cached, src } : null;
  });
  const current = size?.src === src ? size.frame : cache.get(src) ?? null;

  useEffect(() => {
    const cached = cache.get(src);
    if (cached) {
      queueMicrotask(() => setSize({ frame: cached, src }));
      return;
    }

    const image = new Image();
    image.onload = () => {
      const frame = {
        height: image.naturalHeight / ROWS,
        width: image.naturalWidth / COLUMNS,
      };
      cache.set(src, frame);
      setSize({ frame, src });
    };
    image.src = src;
    return () => {
      image.onload = null;
    };
  }, [src]);

  return current;
}
