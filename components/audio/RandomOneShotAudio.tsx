"use client";

import { useEffect } from "react";
import { playOneShot } from "./playOneShot";

export function RandomOneShotAudio({
  maxDelayMs,
  minDelayMs = 0,
  src,
}: {
  maxDelayMs: number;
  minDelayMs?: number;
  src: string;
}) {
  useEffect(() => {
    const minimum = Math.max(0, minDelayMs);
    const maximum = Math.max(minimum, maxDelayMs);
    const delay = minimum + Math.random() * (maximum - minimum);
    const timer = window.setTimeout(() => playOneShot(src), delay);

    return () => window.clearTimeout(timer);
  }, [maxDelayMs, minDelayMs, src]);

  return null;
}
