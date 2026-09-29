"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SpellDefinition } from "./types";
import styles from "./SpellCastAnimation.module.css";

type CastStyle = CSSProperties & {
  "--cast-background-height": string;
  "--cast-background-width": string;
  "--cast-height": string;
  "--cast-image": string;
  "--cast-width": string;
  "--cast-x": string;
  "--cast-y": string;
};

type CastPlayback = {
  durationMs: number;
  playbackRate: number;
};

export function SpellCastAnimation({
  onComplete,
  spell,
}: {
  onComplete: () => void;
  spell: SpellDefinition;
}) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [frameSize, setFrameSize] = useState({ height: 0, width: 0 });
  const [playback, setPlayback] = useState<CastPlayback | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const frames = useMemo(
    () =>
      spell.phases.flatMap((phase) =>
        Array.from({ length: phase.frames }, (_, column) => ({
          column,
          row: phase.row,
        })),
      ),
    [spell.phases],
  );

  useEffect(() => {
    const image = new window.Image();
    image.onload = () => {
      setFrameSize({
        height: (image.naturalHeight / spell.rows) * 2,
        width: (image.naturalWidth / spell.columns) * 2,
      });
    };
    image.src = spell.spriteSrc;

    return () => {
      image.onload = null;
    };
  }, [spell.columns, spell.rows, spell.spriteSrc]);

  useEffect(() => {
    const audio = new Audio(spell.castSoundSrc);
    let disposed = false;
    let prepared = false;

    audio.preload = "auto";
    audioRef.current = audio;

    function preparePlayback() {
      if (disposed || prepared) return;
      prepared = true;

      const soundDurationMs =
        Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration * 1_000
        : frames.length * (spell.frameDuration ?? 90);
      const durationMs = spell.animationDurationSeconds * 1_000;

      setPlayback({
        durationMs,
        playbackRate: soundDurationMs / durationMs,
      });
    }

    audio.addEventListener("loadedmetadata", preparePlayback, { once: true });
    audio.addEventListener("error", preparePlayback, { once: true });
    audio.load();

    return () => {
      disposed = true;
      audio.pause();
      audio.removeEventListener("loadedmetadata", preparePlayback);
      audio.removeEventListener("error", preparePlayback);
      if (audioRef.current === audio) audioRef.current = null;
    };
  }, [
    frames.length,
    spell.animationDurationSeconds,
    spell.castSoundSrc,
    spell.frameDuration,
  ]);

  useEffect(() => {
    if (!playback || frameSize.width === 0) return;

    if (frames.length === 0) {
      onComplete();
      return;
    }

    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.playbackRate = playback.playbackRate;
      void audio.play().catch(() => {
        // The animation still plays if browser audio permissions reject sound.
      });
    }

    let nextFrame = 1;
    const timer = window.setInterval(() => {
      if (nextFrame >= frames.length) {
        window.clearInterval(timer);
        onComplete();
        return;
      }

      setFrameIndex(nextFrame);
      nextFrame += 1;
    }, playback.durationMs / frames.length);

    return () => {
      window.clearInterval(timer);
      audio?.pause();
    };
  }, [frameSize.width, frames.length, onComplete, playback]);

  const frame = frames[frameIndex] ?? { column: 0, row: 0 };
  const x = spell.columns > 1 ? (frame.column / (spell.columns - 1)) * 100 : 0;
  const y = spell.rows > 1 ? (frame.row / (spell.rows - 1)) * 100 : 0;
  const castStyle: CastStyle = {
    "--cast-background-height": `${spell.rows * 100}%`,
    "--cast-background-width": `${spell.columns * 100}%`,
    "--cast-height": `${frameSize.height}px`,
    "--cast-image": `url("${spell.spriteSrc}")`,
    "--cast-width": `${frameSize.width}px`,
    "--cast-x": `${x}%`,
    "--cast-y": `${y}%`,
  };

  return (
    <div className={styles.overlay} aria-label={`${spell.name}: cast`}>
      {frameSize.width > 0 && (
        <span className={styles.sprite} role="img" style={castStyle} />
      )}
    </div>
  );
}
