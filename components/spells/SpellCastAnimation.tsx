"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
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

export function SpellCastAnimation({
  onComplete,
  spell,
}: {
  onComplete: () => void;
  spell: SpellDefinition;
}) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [frameSize, setFrameSize] = useState({ height: 0, width: 0 });
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
    if (frames.length === 0) {
      onComplete();
      return;
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
    }, spell.frameDuration ?? 90);

    return () => window.clearInterval(timer);
  }, [frames.length, onComplete, spell.frameDuration]);

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
